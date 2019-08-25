"use module"
import Defer from "p-defer"

export class AsyncIterThunkDoneError extends Error{
	constructor( asyncIterThunk){
		super("AsyncIterThunkDoneError")
		this.asyncIterThunk= asyncIterThunk
	}
}

const resolved= Promise.resolve()

export class AsyncIterThunk{
	// note: falsy values commented out

	// state
	done= false
	//value= null
	reads= [] // reads from consumers pending new values
	writes= [] // writes from produce awaiting readers
	//ending= false // wrapping up but not done yet
	tail= resolved

	// stored
	onAbort= null

	// modes
	//produceAfterReturn= false
	//strictAsync= false

	constructor( opts){
		this.onAbort= ex=> this.throw( ex)
		this.readCount= 0
		this.writeCount= 0
		if( opts){
			if( opts.signal){
				this.signal= opts.signal
			}
			if( opts.produceAfterReturn){
				this.produceAfterReturn= true
			}
			if( opts.tail|| opts.sloppy){
				this.tail= opts.tail|| null
			}
			if( opts.strictAsync){
				this.strictAsync= resolved
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
	/**
	* Return number of stored write values ready to consume,
	* or if negative, the number of read values pending
	*/
	get writeBalance(){
		if( this.done&& !this.reads){
			return 0
		}
		return reads.length? -reads.length: writes.length
	}

	/**
	* Fill any outstanding reads, then save further produced values
	*/
	produce( ...vals){
		// cannot produce if done
		if( this.done&& !this.reads){
			throw new AsyncIterThunkDoneError( this)
		}
		++this.writeCount

		// resolve as many outstanding reads as we can
		let i= 0
		if( this.reads){
			for( ; i< vals.length&& i< this.reads.length; ++i){
				// resolve
				this.reads[ i].resolve( vals[ i])
			}
			// remove these now satisfied reads
			if( i> 0){
				this.reads.splice( 0, i)
			}

			if( i=== vals.length){
				// vals are gone!
				if( this.done|| this.ending){
					// cleanup, no more reads coming
					delete this.reads
				}
				return
			}
		}

		if( this.ending){
			throw new AsyncIterThunkDoneError( this)
		}

		// save remainder into outstanding writes
		for( ; i< vals.length; ++i){
			this.writes.push( vals[ i])
		}
	}

	_nextReturn( fn, value, done= false){
		value= fn? fn(): value
		// synchronous shortcut: no tracking, no resolving needed
		if( !this.tail&& !(value&& value.then)){
			this.value= value
			const
			  iter0= { done, value},
			  iter= this.strictAsync? Promise.resolve( iter0): iter0
			return iter
		}

		// await value & await tail, then set value & return it's IterationResult
		// wouldn't it be cool if?:
		//   a promise that can describe it's dependencies,
		//   have "progress" of getting's value then waiting for tail
		//   perhaps context-runner style resolution
		const
		  oldTail= this.tail,
		  got= (async ()=> { //IIFE
			value= await value
			if( oldTail){
				await oldTail
			}
			this.value= value
			return {
				done,
				value
			}
		  })()
		// set tail if we're doing that
		if( this.tail){
			this.tail= got
		}
		return got
	}
	next(){
		++this.readCount

		// use already produced writes
		// (if ending, flush these out!)
		if( !this.done&& this.writes&& this.writes.length){
			return this._nextReturn( null, this.writes.shift())
		}

		// already done, return so
		if( this.done|| this.ending){
			return this._nextReturn(()=> ({ done: true, value: this.value }))
		}

		// queue up a new pending read
		let pendingRead= Defer()
		this.reads.push( pendingRead)
		return this._nextReturn( null, pendingRead.promise)
	}
	/**
	* Signify that no further values will be forthcoming
	*/
	end(){
		this.ending= true
		return this.tail|| Promise.resolve()
	}
	/**
	* Stop allowing produce, and stop returning already produced values.
	* If 'produceAfterReturn' mode is set, produce will continue to fulfill already issues reads.
	*/
	return( value){
		this.value= value
		delete this.writes

		if( this.reads&& !this.produceAfterReturn){
			const err= new AsyncIterThunkDoneError( this)
			for( let read of this.reads|| []){
				read.reject( new AsyncIterThunkDoneError( this))
			}
			delete this.reads
		}else if( this.reads){
		}

		if( this.tail)
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
	[ Symbol.iterator](){
		return this
	}
}
export {
	AsyncIterThunk as default,
	AsyncIterThunk as asyncIterThunk,
	AsyncIterThunkDoneError as asyncIterThunkDoneError,
	AsyncIterThunkDoneError as DoneException,
	AsyncIterThunkDoneError as doneException
}
