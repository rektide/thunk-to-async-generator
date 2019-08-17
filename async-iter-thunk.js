"use module"
import Defer from "p-defer"
import Slice from "async-iter-slice/indexed.js"

export class AsyncIterThunk{
	reads= []
	writes= []
	constructor( opts){
		this.onAbort= ex=> this.throw( ex)
		if( opts.signal){
			this.signal= opts.signal
		}
	}
	set signal( signal){
		if( this.signal_){
			this.signal_.removeEventListener( this.onAbort)
		}
		this.signal_= signal
		signal.once( this.onAbort, { passive: true})
	}
	get signal(){
		return this.signal_
	}
	produce( ...vals){
		if( !this.reads){
			throw new Error("AbortError")
		}

		let
		  i= 0,
		  reads= !!this.reads.length
		// satisfy any outstanding reads
		while( i< vals.length&& i< this.reads.length; ++i){
			this.reads[ i].resolve( vals[ i])
		}
		// funnel remainder into outstanding writes
		const writeStart= vals.length- i
		if( writeStart> 0){
			this.writes.push( ...Slice( vals, writeStart))
		}
	}
	next(){
		if( !this.reads){
			throw new Error("AbortError")
		}

		if( this.writes.length){
			return this.writes.unshift()
		}
		var d= Defer()
		this.reads.push( d)
		return d.promise.then( d=> { value: d, done: false})
	}
	return( val){
		for( let read of this.reads|| []){
			read.reject()
		}
		delete this.reads
		delete this.writes
	}
	throw( ex){
		for( let read of this.reads|| []){
			read.reject( ex)
		}
		delete this.reads
		delete this.writes
	}
	[ Symbol.iterator](): {
		return this
	}
}
