"use module"
import Defer from "p-defer"
import Slice from "async-iter-slice/indexed.js"

export class AsyncIterThunkDoneError extends Error{
	constructor( asyncIterThunk){
		super("AsyncIterThunkDoneError")
		this.asyncIterThunk= asyncIterThunk
	}
}

export class AsyncIterThunk{
	// state
	done= false
	value= null
	reads= [] // reads from consumers pending new values
	writes= [] // writes from produce awaiting readers
	ending= false // wrapping up but not done yet
	head= Promise.resolve()

	// stored
	onAbort= null

	// modes
	produceAfterReturn= false

	constructor( opts){
		this.onAbort= ex=> this.throw( ex)
		if( opts){
			if( opts.signal){
				this.signal= opts.signal
			}
			if( opts.produceAfterReturn){
				this.produceAfterReturn= true
			}
			if( opts.sloppy){
				this.head= null
			}
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
	get count(){
		if( this.done&& !this.reads){
			return 0
		}
		return reads.length? -reads.length: writes.length
	}

	produce( ...vals){
		// cannot produce if done
		if( this.done&& !this.reads){
			throw new AsyncIterThunkDoneException( this)
		}

		let i= 0
		// satisfy any outstanding reads
		for( ; i< vals.length&& i< this.reads.length; ++i){
			this.reads[ i].resolve( vals[ i])
		}
		// remove these now satisfied reads
		if( this.reads.length> i){
			// still reads left over
			this.reads= this.reads.slice( i)
			// all vals consumed
			return
		}else if( this.done){
			// produceAfterReturn mode, now done
			delete this.reads
		}else{
			// all vals consumed, start again
			this.reads= []
		}

		// funnel remainder into outstanding writes
		const writeStart= vals.length- i
		if( writeStart> 0){
			this.writes.push( ...Slice( vals, writeStart))
		}
	}
	next(){
		if( !this.done){
			return this.writes.unshift()
		}

		if( this.done){
			return Promise.resolve({
				done: true,
				value: this.value
			})
		}

		if( this.writes.length){
		}
		var d= Defer()
		this.reads.push( d)
		return d.promise.then( d=> { value: d, done: false})
	}
	/**
	* Signify that no further values will be forthcoming
	*/
	end(){
		this.ending= true
		// TODO
	}
	/**
	* Stop allowing produce, and stop returning already produced values.
	* If 'produceAfterReturn' mode is set, produce will continue to fulfill already issues reads.
	*/
	return( value){
		this.value= value
		delete this.writes

		if( this.reads&& !this.produceAfterReturn){
			const err= new AsyncIterThunkReturnError( this)
			for( let read of this.reads|| []){
				read.reject( new AsyncIterThunkReturnError( this))
			}
		}else if( this.reads){
		}
		delete this.reads
		delete this.writes
		return {
			done: true,
			value
		}
	}
	/**
	* Immediately become done and reject and pending reads.
	*/
	throw( ex){
		if( !this.done){
			for( let read of this.reads|| []){
				read.reject( ex)
			}
			delete this.reads
			delete this.writes
		}
		throw ex
	}
	end(){
	
		
	}
	[ Symbol.iterator](): {
		return this
	}
}
export {
	AsyncIterThunk as default,
	AsyncIterThunk as asyncIterThunk,
	AsyncIterThunkDoneException as asyncIterThunkDoneException,
	AsyncIterThunkDoneException as DoneException,
	AsyncIterThunkDoneException as doneException
}
