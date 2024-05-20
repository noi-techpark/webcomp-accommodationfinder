// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from "axios";
import config from "./config";

export async function callGet(path, params) {
    console.log("call = " + config.API_BASE_URL + path);
	console.log("call params = ");
	console.log(params);
	return axios
		.get(config.API_BASE_URL + path, {
			params: params
		})
		.then(function(response) {
			console.log("call response = ");
			console.log(response.data);
			console.log(response.config);
			return response.data;
		})
		.catch(function(error) {
			console.log(error.response);
			throw error;
		});
}


export async function fetchAccommodations() {
    try {
        const response = await callGet("/Accommodation", {
			pagenumber: 1,
            pagesize: 300, // to be incremented
            distinct: true,
            origin: config.ORIGIN
        });
        console.log("Fetched Accommodations: ", response);
        this.accommodations = response;
    } catch (e) {
        console.error(e);
        throw e;
    }
}


export function clearMarkers() {
    // Check if the marker cluster layer exists and clear it
    if (this.layer_columns) {
      this.layer_columns.clearLayers();
      console.log("Empty map on desire");
    }
}


export async function fetchFilteredAccommodations(type_filter, board_filter = null, feature_filter = null, 
                                                            theme_filter = null) {
    try {
        const params = {
			pagenumber: 1,
            pagesize: 300,
			typefilter: type_filter,
			boardfilter: board_filter,
			featurefilter: feature_filter,
			themefilter: theme_filter,
            distinct: true,
            origin: config.ORIGIN,
        };
        
        const response = await callGet("/Accommodation", params);
        console.log("Fetched Filtered Accommodations: ", response);
        return response;
    } catch (e) {
        console.error("Error fetching filtered accommodations:", e);
        throw e;
    }
}


console.log("ninjaApi.js is loaded");
