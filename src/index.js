// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { html, LitElement } from 'lit-element';
import L from 'leaflet';
import leaflet_mrkcls from 'leaflet.markercluster';
import style__leaflet from 'leaflet/dist/leaflet.css';
import style__markercluster from 'leaflet.markercluster/dist/MarkerCluster.css';
import style from './scss/main.scss';
import style__custom from './scss/style.css';
import { getStyle } from './utils.js';
import { fetchAccommodations, fetchFilteredAccommodations } from './api/ninjaApi.js'; 

class MapWidget extends LitElement {

  constructor() {
    super();

    /* Map configuration */
    this.map_center = [46.479, 11.331];
    this.map_zoom = 9;
    this.map_layer = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png";
    this.map_attribution = '<a target="_blank" href="https://opendatahub.com">OpenDataHub.com</a> | &copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a target="_blank" href="https://carto.com/attribution">CARTO</a>';

    /* Internationalization */
    this.language_default = 'en';
    this.language = 'it';

    /* Data fetched from Open Data Hub */
    this.accommodations = []; 
    this.accommodationTypes = {}; 
    this.colors = [
      "#0097B2",
      "#FFBD59",
      "#94485F",
      "7A8148"
    ];

    this.categories = {
      "1": [{value: '16', text: 'All inclusive'}, {value: '512', text: 'Pets allowed'}, {value: '1', text: 'Gourmet Food'}],
      "2": [{value: '512', text: 'Pets allowed'}, {value: '128', text: 'Urban vibes'}],
      "8": [{value: '2', text: 'Breakfast offered'}, {value: '4', text: 'Swimming pool'}, {value: '32', text: 'Hiking'}],
      "4": [{value: '2', text: 'Breakfast offered'}, {value: '64', text: 'WiFi'}, {value: '1024', text: 'Dolomites'}],
      "32": [{value: '4', text: 'Half board'}, {value: '64', text: 'WiFi'}, {value: '256', text: 'Ski Resort'}],
      "64": [{value: '16', text: 'Garage'}, {value: '128', text: 'Urban vibes'}]
  };
    
    /* Requests */
    this.fetchAccommodations = fetchAccommodations.bind(this); 
  }

  async initializeMap() {
    let root = this.shadowRoot;
    let mapref = root.getElementById('map');

    this.map = L.map(mapref, { 
      zoomControl: false 
    }).setView(this.map_center, this.map_zoom);

    L.tileLayer(this.map_layer, {
      attribution: this.map_attribution
    }).addTo(this.map);
  }

  async drawMap() {
    await this.fetchAccommodations();
    let columns_layer_array = [];
    //console.log("Coordinate: ", this.accommodations.Items[0].GpsInfo[0].Latitude);
    //console.log("Coordinate: ", this.accommodations.Items[0].GpsInfo[0].Longitude);
    
    this.accommodations.Items.map(item => {
      // Check if GpsInfo exists and has elements
      if (item.GpsInfo && item.GpsInfo.length > 0) {
        const pos = [
          item.GpsInfo[0].Latitude,
          item.GpsInfo[0].Longitude
        ];

        let icon = L.divIcon({
          html: '<div class="marker" style="background-color: #FFBD59"></div>', 
          iconSize: L.point(25, 25)
        });

        let popupContent = `<b>${item.AccoDetail.en.Name}</b><br>${item.AccoDetail.en.City}, ${item.AccoDetail.en.Street}`;
        let popup = L.popup().setContent(popupContent);

        let marker = L.marker(pos, {
          icon: icon,
        }).bindPopup(popup);

        columns_layer_array.push(marker);
      }

    });

    this.visibleAccommodations = columns_layer_array.length;
    let columns_layer = L.layerGroup(columns_layer_array);

    /** Prepare the cluster group for accommodation markers */
    this.layer_columns = new L.MarkerClusterGroup({
      showCoverageOnHover: false,
      chunkedLoading: true,
      iconCreateFunction: function (cluster) {
        return L.divIcon({
          html: '<div class="marker_cluster__marker">' + cluster.getChildCount() + '</div>',
          iconSize: L.point(36, 36)
        });
      }
    });
    /** Add marker layer in the cluster group */
    this.layer_columns.addLayer(columns_layer);
    /** Add the cluster group to the map */
    this.map.addLayer(this.layer_columns);
  }
  
  async drawMapWithFilters(type_filter, board_filter, feature_filter, theme_filter) {
    //alert("In map drawing process");
    var data = await fetchFilteredAccommodations(type_filter, board_filter, feature_filter, theme_filter);  
  
    let columns_layer_array = [];

    data.Items.map(item => {
      if (item.GpsInfo && item.GpsInfo.length > 0) {
        const pos = [item.GpsInfo[0].Latitude, item.GpsInfo[0].Longitude];
        
        let icon = L.divIcon({
          html: '<div class="marker" style="background-color: #FFBD59"></div>', 
          iconSize: L.point(25, 25)
        });
        let popupContent = `<b>${item.AccoDetail.en.Name}</b><br>${item.AccoDetail.en.City}, ${item.AccoDetail.en.Street}`;
        let popup = L.popup().setContent(popupContent);
        let marker = L.marker(pos, {icon: icon}).bindPopup(popup);
        columns_layer_array.push(marker);
      }
    });
  
    this.visibleAccommodations = columns_layer_array.length;
    let columns_layer = L.layerGroup(columns_layer_array);
    this.layer_columns = new L.MarkerClusterGroup({
      showCoverageOnHover: false,
      chunkedLoading: true,
      iconCreateFunction: function (cluster) {
        return L.divIcon({
          html: '<div class="marker_cluster__marker">' + cluster.getChildCount() + '</div>',
          iconSize: L.point(36, 36)
        });
      }
    });
    this.layer_columns.addLayer(columns_layer);
    this.map.addLayer(this.layer_columns);
  }
  
  async firstUpdated() {
    this.initializeMap();
    this.drawMap();
    this.setupButtonHandlers();
    this.attachListClickListener();
  }

  clearMarkers() {
    // Check if the marker cluster layer exists and clear it
    if (this.layer_columns) {
      this.layer_columns.clearLayers();
      console.log("Empty map on desire");
    }
  }

  setupButtonHandlers() {   //BUTTON HANDLER

    let root = this.shadowRoot;

    const togglebutton = root.getElementById("sidebar");    

    console.log('togglebutton');

    if (togglebutton) {
      togglebutton.addEventListener("click", () => {
        console.log('togglebutton clicked');
        this.toggleDropdown();
        //this.callParkingApiDrawMap();
      });
    }
  }

  toggleDropdown() {
    var dropdown = this.shadowRoot.getElementById("myDropdown");
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
  }


  attachListClickListener() {

  let root = this.shadowRoot;

  var self = this

  root.getElementById('accommodationList').addEventListener('click', function(event) {
      if (event.target.tagName === 'LI') {
          // Remove the 'selected' class from all elements and add it to the clicked element
          var listItems = root.querySelectorAll('#accommodationList li');
          listItems.forEach(li => li.classList.remove('selected'));
          event.target.classList.add('selected');
          
          self.populateCheckboxes(event.target.getAttribute('data-value'));
      }
  });
  }

  populateCheckboxes(selectedValue) {

    var root= this.shadowRoot;
    var self = this

    var dropdown = root.getElementById('myDropdown');
    var checkboxesHtml = '<ul id="accommodationList">' + dropdown.querySelector('ul').innerHTML + '</ul>';

    checkboxesHtml += '<div class="separator"></div>';
    checkboxesHtml += '<div class="more-filters-title">More filters</div>';

    this.categories[selectedValue].forEach(function(item) {
        checkboxesHtml += '<label><input type="checkbox" value="' + item.value + '"> ' + item.text + '</label>';
    });

    checkboxesHtml += '<div class="button-container">';
    checkboxesHtml += '<button id="confirmbutton" class="button">Confirm</button>';
    checkboxesHtml += '<button id="resetbutton" class="button">Reset</button>';
    checkboxesHtml += '</div>';

    dropdown.innerHTML = checkboxesHtml;
    

    root.getElementById('confirmbutton').addEventListener('click', function(event) {
      self.confirm();
    });
    root.getElementById('resetbutton').addEventListener('click', function(event) {
      self.reset();
    });

    this.attachListClickListener(); 
  }

  confirm() {

  let root = this.shadowRoot;

  var selectedListItem = root.querySelector('#accommodationList li.selected');
  if (!selectedListItem) {
      console.log("No element was selected from the given list.");
      return;
  }

  var selectedValue = selectedListItem.getAttribute('data-value');

  var checkboxes = root.querySelectorAll('#myDropdown input[type="checkbox"]');
  var selectedCheckboxes = Array.from(checkboxes).map(cb => cb.checked ? cb.value : null);
 
  //var mapWidget = root.querySelector('map-widget');

  //if (mapWidget) {            
      this.clearMarkers();

      if(selectedValue == 2 || selectedValue == 64){
        this.drawMapWithFilters(selectedValue, null, selectedCheckboxes[1], selectedCheckboxes[2]);
          //alert(selectedCheckboxes[1]);
      } else {
        this.drawMapWithFilters(selectedValue, selectedCheckboxes[0], selectedCheckboxes[1], selectedCheckboxes[2]);
      }

      console.log("Everything was fetched");
  //}

  console.log('Selected Category:', selectedValue);
  console.log('Selected Filters:', selectedCheckboxes);
  }

  removeMarkers(){

  let root = this.shadowRoot;

  var mapWidget = root.querySelector('map-widget');
  if (mapWidget) {
      mapWidget.clearMarkers();
      //console.log('Markers cleared successfully.');
  } else {
      //console.log('Error: Map widget not found.');
  }
  }


reset() {

  let root = this.shadowRoot;

  var dropdown = root.getElementById('myDropdown');
  var initialHtml = `
      <ul id="accommodationList">
          <li data-value="0">Hotel Pension</li>
          <li data-value="1">Bed&Breakfast</li>
          <li data-value="2">Camping</li>
          <li data-value="3">Farm</li>
          <li data-value="4">Mountain</li>
          <li data-value="5">Apartment</li>
      </ul>`;
  dropdown.innerHTML = initialHtml;
  this.attachListClickListener();  
  this.removeMarkers();
}


  render() {
    return html`
      <style>
        ${getStyle(style__markercluster)}
        ${getStyle(style__leaflet)}
        ${getStyle(style)}
        ${getStyle(style__custom)}        
      </style>
      <div id="map_widget">
        <div class="map-container">
        <div id="sidebar" class="sidebar">
            <span class="sidebar-text">Search for accommodation</span>
            <img src="data:image/png;base64,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" alt="Filter" class="icon-image">
        </div>
        <div class="dropdown-content" id="myDropdown">
            <ul id="accommodationList">
                <li data-value="1">Hotel Pension</li>
                <li data-value="2">Bed&Breakfast</li>
                <li data-value="8">Camping</li>
                <li data-value="4">Farm</li>
                <li data-value="32">Mountain</li>
                <li data-value="64">Apartment</li>
            </ul>
        </div>
        <div id="map" class="map"></div>       
      </div>            
    </div>
    `;
  }
}

if (!window.customElements.get('map-widget')) {
  window.customElements.define('accommodation-finder-widget', MapWidget);
}

