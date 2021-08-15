.hc 0.6.0

```Composable Query Meta-Language

A simple, easily-parseable format for specifying and composing:
- queries
- configuration
- data
and abstractions thereof

It has its own runtime and native integrations, but can also emit CSV, SQL, and YAML for use with legacy tools. Because it is a simple tree data structure, it can also be losslessly visualized and edited by graphical UIs.

CQML builds on HCSV, a strict, strongly typed format for specifying comma-separated values.  HCSV is itself a  "congram" of Homoiconic C, a small but powerful language for expressing data manipulation.

## Tablea

Conceptually, we can think of tables as rows of property lists. Importantly, CQML only specifies the external semantics.  The underlying runtime can use whatever storage representation, mechanisms and policy it wants (or has been configured to use).

Everything in CQML is
just grouped expressions of values, names, and operators. Queries can operate directly on rows, or be mapped across tables.

## Queries
```
; user .name
#  'Jane'
; user (.name, .role)
#  (.name 'Jane', .role 'Boss')

; Users & .name
# [ 'Jane', 'Joe']
; Users & (.name, .role)
[
#  (.name 'Jane', .role 'Boss')
#  (.name 'Joe', .role 'Freelancer')
]
```
## Filters

Filters are just lazy predicates:
```
; Users | {role = 'Boss'}
#  (.name 'Jane', .role 'Boss')
```
Note that equal is an operator. Assignment is done directly by names, which can be evaluated anywhere in an expression.
```
; .is-boss {role = 'Boss'};
; Users | is-boss
#  (.name 'Jane', .role 'Boss')
```
## Joins
```
; .uc-name (.u,.c) ^ {u.name = c.name};
; <Users,Contacts> | uc-name
[
#  (.name 'Jane', .role 'Boss', .phone 555.1212)
]
```
Where <> is the type operator, usually pronounced "all."
```
