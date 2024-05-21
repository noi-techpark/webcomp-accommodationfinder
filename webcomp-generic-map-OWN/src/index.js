import { html, LitElement } from 'lit-element';
import L from 'leaflet';
import leaflet_mrkcls from 'leaflet.markercluster';
import style__leaflet from 'leaflet/dist/leaflet.css';
import style__markercluster from 'leaflet.markercluster/dist/MarkerCluster.css';
import style from './scss/main.scss';
import { getStyle } from './utils.js';
import { fetchAccommodations } from './api/ninjaApi.js'; 
//import { clearMarkers } from './api/ninjaApi.js'; 

class MapWidget extends LitElement {

  static get properties() {
    return {
      propAccommodationTypes: { 
        type: String,
        attribute: 'accommodation-types'
      },
    };
  }

  constructor() {
    super();

    /* Map configuration */
    this.map_center = [46.479, 11.331];
    this.map_zoom = 9;
    this.map_layer = "https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png";
    this.map_attribution = '<a target="_blank" href="https://opendatahub.com">OpenDataHub.com</a> | &copy; <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a target="_blank" href="https://carto.com/attribution">CARTO</a>';

    /* Internationalization */
    this.language_default = 'en';
    this.language = 'de';

    /* Data fetched from Open Data Hub */
    this.accommodations = []; 
    this.accommodationTypes = {}; 
    this.colors = [
      "green",
      "blue",
      "red",
      "orange"
    ];
    
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
    console.log("Coordinate: ", this.accommodations.Items[0].GpsInfo[0].Latitude);
    console.log("Coordinate: ", this.accommodations.Items[0].GpsInfo[0].Longitude);
    
    this.accommodations.Items.map(item => {

      // Check if GpsInfo exists and has elements
      if (item.GpsInfo && item.GpsInfo.length > 0) {
        const pos = [
          item.GpsInfo[0].Latitude,
          item.GpsInfo[0].Longitude
        ];

        let icon = L.divIcon({
          html: '<div class="marker" style="background-color: blue"></div>', 
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

  async firstUpdated() {
    this.initializeMap();
    this.drawMap();
  }

  clearMarkers() {
    // Check if the marker cluster layer exists and clear it
    if (this.layer_columns) {
      this.layer_columns.clearLayers();
      console.log("Empty map on desire");
    }
  }

  ///CLEAR MARKERS INTO NINJAAPI.JS
  

  
  render() {
    return html`
      <style>
        ${getStyle(style__markercluster)}
        ${getStyle(style__leaflet)}
        ${getStyle(style)}
      </style>
      <div id="map_widget">
        <div id="map" class="map"></div>
      </div>
    `;
  }
}

if (!window.customElements.get('map-widget')) {
  window.customElements.define('map-widget', MapWidget);
}
