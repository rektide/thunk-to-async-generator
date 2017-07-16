"use strict"
var defer= require( "p-defer")
var Deque = require( "double-ended-queue")

function thunkToAsyncGenerator(){
	var wake= defer()
	var queue= new Deque()
	var readers= []
	var produced= 0
	var done
	var error
	function next( data){
		queue.push(data)
		++produced
		if (state.onPut){
			state.onPut()
		}

		var old= wake
		wake= defer()
		old.resolve()
	}
	function nodeThunk( err, data){
		if (err){
			end( err)
			return
		}
		thunk( data)
	}
	function complete( err){
		done= true
		error= err
		wake.promise.catch(function(){})
		wake.reject( err)
		return
	}
	async function* asyncGenerator(){
		var reader= readers.length
		readers.push(0)

		function shiftReader(){
			if( produced> readers[ reader]){
				// advance reader
				var pos= readers[ reader]++
				var val= queue.get( pos)
				if( state.onUnshift){
					state.onUnshift()
				}
				// read element
				return val

			}
			if( done){
				// a value is never coming:
				throw new Error("input ran out")
			}

			// all available data has been consumed, try again
			return wake.promise.then( shiftReader)
		}

		while( true){
			// synchronously read as many as we can
			while( produced> readers[ reader]){
				if( done){
					return
				}
				yield shiftReader()
			}
			if( done){
				return
			}
			// wait for signal then read
			// this can get invoked multiple times & everyone will
			yield wake.promise.then(shiftReader)
		}
	}
	function dequeue(){
		// find oldest
		var oldest= produced
		for( var i= 0; i< readers.length; ++i){
			var pos= readers[ i]
			if( pos< oldest){
				oldest= pos
			}
		}
		if( oldest== 0){
			return;
		}

		// dequeue/shift
		for( var i= 0; i< oldest; ++i){
			queue.shift()
		}

		// update positions
		produced -= oldest;
		for( var i= 0; i< readers.length; ++i){
			readers[ i] -= oldest;
		}
	}
	var state= {
		next,
		nodeThunk,
		asyncGenerator,
		[Symbol.asyncIterator]: asyncGenerator,
		complete,
		dequeue,
		onUnshift: dequeue // by default dequeues after every read
	}
	return state
}


module.exports= thunkToAsyncGenerator
