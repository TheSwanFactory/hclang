#!/usr/bin/env hc
`Class support is an interpretation of ordinary frames, closures, visibility,
effects, and parent lookup. These examples intentionally use no class-specific
runtime primitive.`

`A mutable singleton shares identity through its trailing-underscore handle.
The same trailing underscore declares the method allowed to write it, so one
marker spells the whole effect axis: an underscore touches identity.`
; .counter_ [._value 1; .get {value}; .set_ {@value _;}];
; counter_.get()
# 1
; counter_.set_ 2;
; counter_.get()
# 2

`Both halves of that axis coexist on one aggregate without interference: here a
trailing underscore names a mutable field, declares the method that replaces it,
and marks the receiver each is reached through.`
; .box_ [.slot_ [.n 1]; .fill_ {@slot_ _;}; .read {slot_.n}];
; box_.read()
# 1
; box_.fill_ [.n 7];
; box_.read()
# 7

`A class is a reusable closure that returns a fresh aggregate. Uppercase fields
prove that constructor state does not leak between repeated instances.`
; .Point {[.X _; .getX {X}]};
; .first (Point 3);
; .second (Point 5);
; first.getX()
# 3
; second.getX()
# 5

`Mutating methods return their receiver, but assignment failures remain errors.`
; .constant_ [.Value 1; .change_ {@Value _;}];
; [constant_.change_ 2]
# [($error{$is-constant .Value});]
; constant_.Value
# 1

`A mutating method reached through an immutable handle is a functional update:
the call evaluates to the new value, and the original is untouched at any depth.`
; .pair [.inner_ [.n 1; .set-n_ {@n _;}]; .bump_ {inner_.set-n_ _}];
; (pair.bump_ 5).inner_.n
# 5
; pair.inner_.n
# 1

`A bare sibling mutator remains functional inside a non-mutating method.`
; .sibling-owner [.value 1; .write_ {@value _;}; .sneak {write_ _}];
; .sibling-copy (sibling-owner.sneak(9));
; sibling-owner.value
# 1
; sibling-copy.value
# 9

`Built-in control-flow blocks retain the active receiver capability.`
; .callback-owner_ [.value 1; .write_ {1 ? {@value 9}}];
; callback-owner_.write_ 9;
; callback-owner_.value
# 9

`A mutable receiver takes no copy, so the nested identity it declares is shared.`
; .live_ [.inner_ [.n 1; .set-n_ {@n _;}]; .bump_ {inner_.set-n_ _}];
; live_.bump_ 9;
; live_.inner_.n
# 9

`A parent declaration uses the existing up relationship. Descendants inherit
public and protected values, while private values remain inaccessible.`
; .base [.public 42; ._protected 21; .__private 7];
; .Derived {[.^ base; .values {[public, protected, private]}]};
; .derived (Derived());
; derived.values()
# [42, 21, $!.is-private .private]
; derived.public
# 42
; derived.protected
# $!.is-protected .protected

`Visibility grades the declared parent chain, not lexical nesting. A method
reaches every property of its own receiver, including private ones.`
; .owner [.open 42; ._shared 21; .__secret 7; .own-method {[open, shared, secret]}];
; owner.own-method()
# [42, 21, 7]

`That access survives nesting: a scope inside a method body still runs against
the same receiver.`
; .nester [.__deep 3; .via-group {(deep)}; .via-block {[deep] | {_}}];
; nester.via-group()
# 3
; nester.via-block()
# [3]

`An unrelated peer is refused, whether it asks directly or from inside its own
method, because it declares no parent.`
; .thief [.steal {owner.shared}];
; thief.steal()
# $!.is-protected .shared
; owner.shared
# $!.is-protected .shared

`A merely nested aggregate is a peer, not a descendant: containment grants no
protected access.`
; .outer [._inner-secret 21; .nested [.read {inner-secret}]];
; outer.nested.read()
# $!.is-protected .inner-secret

`A mutating method re-parents a mutable receiver in place.`
; .old-parent [.marker 1];
; .new-parent [.marker 2];
; .mutable-child_ [.^ old-parent; .reparent_ {.^ _;}];
; mutable-child_.reparent_ new-parent;
; mutable-child_.marker
# 2

`The same mutating method reached through an immutable handle re-parents only
its functional copy; the original keeps its declared parent.`
; .immutable-child [.^ old-parent; .reparent_ {.^ _;}];
; .updated-child (immutable-child.reparent_ new-parent);
; immutable-child.marker
# 1
; updated-child.marker
# 2

`A non-mutating method has no authority to re-parent even a mutable receiver.`
; .blocked-child_ [.^ old-parent; .reparent {.^ _;}];
; [blocked-child_.reparent(new-parent)]
# [($!.method-not-mutating .^);]

`The language-level writer rejects direct and indirect cycles.`
; .self_ [.reparent_ {.^ _;}];
; [self_.reparent_ self_]
# [($!.cyclic-parent .^);]
; .left_ [.reparent_ {.^ _;}];
; .right_ [.^ left_];
; [left_.reparent_ right_]
# [($!.cyclic-parent .^);]

`Multiple-base behavior is ordinary user-defined composition, not inheritance
syntax or a built-in policy.`
; .compose { [.left _.0.left; .right _.1.right] };
; .combined (compose [[.left 1], [.right 2]]);
; combined.left
# 1
; combined.right
# 2
