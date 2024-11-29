; Allocate a 2x2 buffer
.buffer memref.alloc() -> <memref<2x2xf32>>;

; Store some computed values
memref.store(1.0, buffer[0, 0]);
memref.store(2.0, buffer[0, 1]);

; Load a value and use it
.val memref.load(buffer[0, 0]);
.doubled val * 2.0;
memref.store(doubled, buffer[1, 0]);
