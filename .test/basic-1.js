#!/usr/bin/env node

var tape= require("blue-tape")
var Ttag= require("..")

tape("produce then consume", async function(tape){
	var ttag= Ttag()

	ttag.next( 111)

	var generator= ttag.asyncGenerator()
	var wait1= await generator.next()

	tape.ok( wait1.value, "a value was produced")

	var value= await Promise.resolve( wait1.value)
	tape.equal( value, 111, "value 111 was eventually produced")
})


tape("consume then produce", async function(tape){
	tape.plan(12)
	var ttag= Ttag()

	var generator= ttag.asyncGenerator()
	var wait1= await generator.next()

	// ask for first output
	tape.ok( wait1.value, "first output created")
	tape.ok( wait1.value.then, "first output is a promise")
	var err1= wait1.value.then( val=> {
		tape.fail("no first value ought have resolved")
	}, e=> {
		tape.pass("first value indeed never resolved")
	})

	// ask for second output
	// not using await, allowing execution to pass through
	var val2= generator.next()
	tape.ok( val2, "got a second output")
	tape.ok( val2.then, "second output is a promise")
	
	var then2= val2.then( v=> {
		tape.ok( v.value, "second output eventually has a value")
		tape.ok( v.value.then, "second output's eventual value is also a promise")
		return v.value
	})
	var err2= then2.then( val=> {
		tape.fail("no second value ought have resolved")
	}, e=> {
		tape.pass("second value indeed never resolved")
	})

	// end without having given any input
	ttag.complete()

	// ask again
	var val3 = generator.next()
	tape.ok(val3, "got a third output")
	tape.ok(val3, "third output is a promise")
	var then3= val3.then( v=>{
		tape.notOk( v.value, "third output resolves with no value")
		tape.ok( v.done, "third output resolves done")
	})

	return Promise.all([
		err1,
		err2,
		then3
	])
})

tape("end then consume", async function(tape){
	tape.plan(2)
	var ttag= Ttag()
	var generator = ttag.asyncGenerator()

	ttag.complete()

	var wait1 = await generator.next()
	tape.notOk( wait1.value, "should not have a value")
	tape.ok( wait1.done, "should be done")
})


tape("consume then end", async function(tape){
	var ttag= Ttag()

	var generator = ttag.asyncGenerator()
	var wait1 = await generator.next()

	tape.ok(wait1.value, "a value was produced")
	tape.ok(wait1.value.then, "value is a promise")

	ttag.next(111)

	var value = await Promise.resolve(wait1.value)
	tape.equal(value, 111, "value 111 was eventually produced")
})

tape("interleaving multiple consumers", async function(tape){
	var ttag= Ttag()

	// make two generators
	var gen1= ttag.asyncGenerator()
	var gen2= ttag.asyncGenerator()

	// get a promise for the first value (on generator 1)
	var wait1g1 = await gen1.next()
	tape.ok(wait1g1.value, "generator 1 has a first value")
	tape.ok(wait1g1.value.then, "generator 1 has a first promise")
	var val1g1 = wait1g1.value.then(val => {
		tape.equal(val, 111, "generator 1's first value resolves to 111")
	})

	// insert first value
	ttag.next(111)

	// immediately get first value (on generator 2)
	var wait1g2 = await gen2.next()
	tape.ok(wait1g2.value, "generator 2 has a first value")
	var val1g2 = Promise.resolve(wait1g2.value).then(val => {
		tape.equal(val, 111, "generator 2's first value resolves to 111")
	})

	// now the reverse sequence - read from g2, thunk, read from g1

	// get a promise for the second value (on generator 1)
	var wait2g2 = await gen2.next()
	tape.ok(wait2g2.value, "generator 2 has a second value")
	tape.ok(wait2g2.value.then, "generator 2 has a second promise")
	var val2g2 = wait2g2.value.then(val => {
		tape.equal(val, 222, "generator 2's second value resolves to 222")
	})

	// insert second value
	ttag.next(222)

	// immediately get second value (on generator 2)
	var wait2g1 = await gen1.next()
	tape.ok(wait2g1.value, "generator 1 has a second value")
	var val2g1 = Promise.resolve(wait2g1.value).then(val => {
		tape.equal(val, 222, "generator 1's second value resolves to 222")
	})

	return Promise.all([
		val1g1,
		val1g2
	])
})
