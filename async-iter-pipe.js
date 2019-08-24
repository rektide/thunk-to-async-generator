"use module"
import Defer from "p-defer"

export class AsyncIterThunkDoneError extends Error{
	constructor( asyncIterThunk){
		super("AsyncIterThunkDoneError")
		this.asyncIterThunk= asyncIterThunk
	}
}

const resolved= Promise.resolve()

function valueize( value, done= false){
	done= !!done
	if( value.then){
		return value.then( value=> ({
			done,
			value
		}))
	}
	return {
		done,
		value
	}
}

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
	get count(){
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

		// resolve as many outstanding reads as we can
		let i= 0
		for( ; i< vals.length&& i< this.reads.length; ++i){
			// resolve
			const val= this._valueize( vals[ i])
			this.reads[ i].resolve( val)
		}
		// remove these now satisfied reads
		if( this.reads.length> i){
			// still reads left over, remove satisfied ones
			this.reads= this.reads.slice( i)
		}else{
			// all reads satisfied!
			if( this.done|| this.ending){
				delete this.reads
			}else{
				this.reads= []
			}
			return
		}


		if( this.ending){
			throw new AsyncIterThunkDoneError( this)
		}

		// save remainder into outstanding writes
		for( ; i< vals.length; ++i){
			const val= this._valueize( vals[ i])
			this.writes.push( val)
		}
	}

	_valueize( value, strictAsync= this.strictAsync, done= false){
		done= !!done
		if( value&& value.then){
			return value.then( this._valueize) // should not get called again
		}
		value= {
			done,
			value
		}
		if( strictAsync){ // if value was a promsie, this will be global, & thus strictAsync is undefined
			return Promise.resolve( value)
		}
		return value
	}

	_nextReturn( value, done= this.done){
		if( this.tail){
			
		}

			return this.tail= this.tail.then( async ()=> {

		}else if( value.then){
			
		}else if( this.strictAsync){
		}
		const value= fn()
		if( value.then){
			value.then( value=> {
				
				done: false,
				value
			})
		}
	}

	next(){

		// use awaiting already produced writes
		// (if ending, flush these out!)
		if( !this.done&& this.writes.length){
			let value= this.writes.unshift()
			if( this.tail){
				return this.tail= this.tail.then( async ()=> {
					value= await value
					return {
						done: false,
						value
					}
				})
			}else if( value.then){
				return value.then( value=> ({
					done: false,
					value
				})
			}else{
				return {
					done: false,
					value
				}
			}
		}

		// already done, return so
		if( this.done|| this.ending){
			// wait for tail to finish then be done
			if( this.tail){
				return this.tail= this.tail.then(()=> ({
					done: true,
					value: this.value
				}))
			}
			// sloppy mode: no waitiing
			return {
				done: true,
				value: this.value
			}
		}

		// queue up a new pending read
		let d= Defer()
		this.reads.push( d)
		if( this.tail){
			const oldTail= this.tail
			// wait for tail
			return this.tail= this.tail.then(async ()=> {
				const value= await d.promise
				this.value= value
				return {
					// await value
					value,
					done: false
					//// not done if there are more entailed, or if not done
					//done: oldTail=== this.tail&& this.done
				}
			})
		}
		return d.promise.then( value=> {
			this.value= value
			return {
				value,
				done: false
			}
		})
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
			const err= new AsyncIterThunkReturnError( this)
			for( let read of this.reads|| []){
				read.reject( new AsyncIterThunkReturnError( this))
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
	[ Symbol.iterator](): {
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
