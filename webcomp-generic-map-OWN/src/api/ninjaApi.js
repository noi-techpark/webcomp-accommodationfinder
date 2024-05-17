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
            limit: 200,
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
