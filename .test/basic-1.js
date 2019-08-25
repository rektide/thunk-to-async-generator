#!/usr/bin/env node
"use module"

import tape from "tape"
import AGT from ".."

tape( "produce then consume", async function( t){
	t.plan( 2)
	const agt= new AGT()
	agt.produce( 111)
	agt.produce( 222)

	const
	  next1= agt.next(),
	  next2= agt.next(),
	  next3= agt.next()
	tape.equal( (await next1).value, 111, "value 111 was eventually produced")
	tape.equal( (await next2).value, 222, "value 222 was eventually produced")
	t.end()
})

tape( "consume then produce", async function( t){
	t.plan( 7)
	const agt= new AGT()
	let i= 0
	agt.next().then( cur=> {
		tape.equal( i++, 0, "first value")
		tape.equal( cur.value, 111, "value 111 was eventually produced")
	})
	agt.next().then( cur=> {
		tape.equal( i++, 1, "second value")
		tape.equal( cur.value, 222, "value 222 was eventually produced")
	})
	await Immediate()
	t.equal( i, 0, "nothing produced yet")

	agt.produce( 111)
	await Immediate()
	t.equal( i, 1, "first value produced")

	agt.produce( 222)
	await Immediate()
	t.equal( i, 2, "first value produced")
	t.end()
})

tape("consume then end", async function( t){
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

tape( "end then consume", async function( t){
	t.plan( 4)
	const agt= new AGT()
	agt.produce( 111)
	agt.produce( 222)
	let next111= agt.next() // consume, successfully
	agt.return( 42) // end
	let nextReturned= agt.next() // consume, but had ended

	next111= await next111
	t.equal( next111.value, 111, "got first value")
	t.equal( next111.done, false, "first was not done")

	nextReturned= await nextReturned
	t.equal( nextReturned.value, 42, "got return value")
	t.equal( nextReturned.done, true, "second was done")
	t.end()
})


tape( "produce done after return", async function( t){
})

tape( "produceAfterReturn", async function( t){

})

tape( "count", async function( t){
})
