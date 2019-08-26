# async-iter-pipe

> an manually fed async-iterator that can queue reads or writes

## Ideas

Would like to create modular "strategies" for closing down read & write queues, and reimplement return/throw in terms of these. These strategies should be executable routines that wire in various handlers on to async-iter-pipe.

Promises for all manners of state: when read/write/everything are fully done/drained, when they start to be drained, when they are rejected.

Misc features. Limit depths. Map / reduce / transduce capabilities.
