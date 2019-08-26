#!/usr/bin/env node
"use module"

import tape from "tape"
import Immediate from "p-immediate"
import AGT, { AsyncIterThunkDoneError} from ".."

tape( "produce then consume", async function( t){
	t.plan( 2)
	const agt= new AGT()
	agt.produce( 111)
	agt.produce( 222)

	const
	  next1= agt.next(),
	  next2= agt.next(),
	  next3= agt.next()
	t.equal( (await next1).value, 111, "value 111 was eventually produced")
	t.equal( (await next2).value, 222, "value 222 was eventually produced")
	// TODO: sleep, validate 3 not resolved
	t.end()
})

tape( "consume then produce", async function( t){
	t.plan( 7)
	const agt= new AGT()
	let i= 0
	agt.next().then( cur=> {
		t.equal( cur.value, 111, "produced first value, 111")
		t.equal( i++, 0, "produced first value")
	})
	agt.next().then( cur=> {
		t.equal( i++, 1, "produced second value, 222")
		t.equal( cur.value, 222, "produced second value")
	})
	await Immediate()
	t.equal( i, 0, "saw nothing")

	agt.produce( 111)
	await Immediate()
	t.equal( i, 1, "saw first value")

	agt.produce( 222)
	await Immediate()
	t.equal( i, 2, "saw second value")
	t.end()
})

tape( "consume then end", async function( t){
	t.plan( 6)
	const agt= new AGT()
	agt.produce( 111)
	let next111= agt.next() // consume, successfully
	let next222= agt.next() // consume, successfully
	agt.produce( 222)
	agt.return( 42) // end
	let nextReturned= agt.next() // consume, but had ended

	next111= await next111
	t.equal( next111.value, 111, "got first value")
	t.equal( next111.done, false, "first was not done")

	next222= await next222
	t.equal( next222.value, 222, "got first value")
	t.equal( next222.done, false, "first was not done")

	nextReturned= await nextReturned
	t.equal( nextReturned.value, 42, "got return value")
	t.equal( nextReturned.done, true, "second was done")
	t.end()
})

tape( "return then consume fails", async function( t){
	t.plan( 4)
	const agt= new AGT()
	agt.produce( 111) // gets dropped by return
	t.equal( agt.queueCount, 1, "one write queued")


	agt.return( 42) // end
	t.equal( agt.queueCount, 0, "queued write dropped")
	let nextReturned= agt.next() // going to fail
	nextReturned= await nextReturned
	t.equal( nextReturned.value, 42, "got return value")
	t.equal( nextReturned.done, true, "second was done")
	t.end()
})

tape( "return then produce fails", async function( t){
	t.plan( 5)
	const agt= new AGT()
	let nextReturned= agt.next()
	t.equal( agt.queueCount, -1, "queued read")
	agt.return( 42) // end
	t.equal( agt.queueCount, 0, "dropped queued read")

	try{
		agt.produce( 678)
		t.fail( "unexpected success of produce")
	}catch( ex){
		t.ok( ex instanceof AsyncIterThunkDoneError, "got expected AsyncIterThunkDoneError from produce")
		t.equal( agt.queueCount, 0, "produce did not change queueCount")
	}

	nextReturned.catch( function( ex){
		t.ok( ex instanceof AsyncIterThunkDoneError, "got expected AsyncIterThunkDoneError from in flight AsyncIterationResult")
		t.end()
	})
})

tape( "produceAfterReturn", async function( t){
	t.plan( 4)
	const agt= new AGT({ produceAfterReturn: true})
	let
	  next1= agt.next(),
	  return1= agt.return( 42)
	agt.produce( 111)

	next1= await next1
	t.equal( next1.value, 111, "got 111")
	t.equal( next1.done, false, "was not done")

	return1= await return1
	t.equal( return1.value, 42, "return value")
	t.equal( return1.done, true, "return done")
	t.end()
})

tape( "count", async function( t){
	t.plan( 2)
	const agt= new AGT()
	let
	  read1= agt.next(),
	  read2= agt.next()
	t.equal( agt.queueCount, -2, "has two outstanding read requests")
	agt.produce( 1)
	agt.produce( 2)
	agt.produce( 3)
	agt.produce( 4)
	t.equal( agt.queueCount, 2, "has two queued writes")
	t.end()
})
