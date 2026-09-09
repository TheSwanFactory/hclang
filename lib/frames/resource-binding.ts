/**
 * How a resource identifier finds the authority it resolves against.
 *
 * `FrameURI` has to ask the root binding to extend itself, and the root binding
 * is a `FrameResource`, which is a `FrameURI`. Naming the capability structurally
 * rather than by class breaks that cycle, and it states the contract in one
 * place: a root binding is anything that can hand back an attenuated child.
 *
 * @module
 */
import type { Frame } from "./frame.ts";

/**
 * The name the root binding answers to in the host namespace.
 *
 * Nameable on purpose. An unnameable lookup tier is a structural defect, and the
 * point of the root binding is that the perimeter is enumerable: `$$.root` is
 * the authority, so a program that holds it holds the authority, visibly.
 */
export const RESOURCE_ROOT_KEY = "root";

/** A capability that yields children and never anything wider. */
export interface ResourceBinding {
  /** Extends this binding by one reference, or refuses. */
  extend(reference: string): Frame;
}

/** Recognizes a root binding without importing the class that implements it. */
export const isResourceBinding = (
  frame: Frame,
): frame is Frame & ResourceBinding =>
  "extend" in frame &&
  (frame as Frame & ResourceBinding).extend instanceof Function;
