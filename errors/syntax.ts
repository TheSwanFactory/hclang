-_.each(atomClasses, (Klass: any) => {
  const sample: frame.FrameAtom = new Klass('')
  const key = sample.string_start()
  syntax[key] = new Lex(Klass)
})

OR
atomClasses,forEach((Klass: any) => {
  const sample: frame.FrameAtom = new Klass('')
  const key = sample.string_start()
  syntax[key] = new Lex(Klass)
})
