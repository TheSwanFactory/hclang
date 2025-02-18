.hc 0.6.0

```
### HCSV

Homoiconic C may finally provide a well-defined alternative to the
ubiquitous CSV[@Cite] file. A properly-structured ".hcsv" file is just as compact
as CSV, with two important differences:
* The header row, if any, consists of a list of names
* Strings must be (smart) quoted
```
.first-name, .last-name, .phone-number
“John”, “Doe”, +1.408.555.1212
“Jane”, “Smith”, +1.650.555.1212
```

### HCSON

HC can also emulate the popular JSON[@Cite] format, or more precisely its
CoffeeScript cousin CSON[@Cite].
```
.first-name “John”, .last-name “Doe”, .phone-number +1.408.555.1212
.first-name “Jane”, .last-name “Smith”, .phone-number +1.650.555.1212
