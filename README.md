# Thunk To Async Generator

> One or more Async Generators fed by a Thunk

Create an object that exposes:

* `.asyncGenerator()` to create a new async generator that iterates through input
* `.next(input)` allowing data to be passed in
* `.complete()` to declare no more input

If there are multiple async generators, each will get a copy of the data created since their point of inception.

Data will be queued until at least one consuming async generator is available.

# Todo

* More explicit end of input early termination
* Better testing from a consuming `for await` loop
