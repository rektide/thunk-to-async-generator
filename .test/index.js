#!/usr/bin/env node
"use strict"

var fs= require("fs")

function main(){
	fs.readdir( __dirname, function( err, files){
		for( var file of files){
			if( !file.endsWith( ".js")){
				continue
			}
			require( __dirname+ "/"+ file)
		}
	})
}

module.exports= main
if( require.main=== module){
	module.exports()
}
