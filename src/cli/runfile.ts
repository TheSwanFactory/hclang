RUNDOC="#!/usr/bin/env hc \n```\n"

// prefix adoc/md input file with RUNDOC header

 runfile(file) {
    const rl = readline.createInterface(fs.createReadStream(file), undefined)
    rl.on('line', (line) => {
        hc_eval.call(line)
    })
    evaluated = true      
}
