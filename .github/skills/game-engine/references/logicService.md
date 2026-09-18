# LogicService Reference

`LogicService` is a **dependency-free shared utility service** for common 2D game/Canvas logic. Prefer using these utilities instead of implementing duplicate math/drawing helpers.

## Geometry & Rotation

### `LogicService.pointAfterRotation(centerX, centerY, point2X, point2Y, angle)`

Rotate a point around another point.

* `angle` is in **radians**.
* Returns `{ x, y }`.
* Useful for turret barrels, bullets, muzzle flashes, attachments, etc.

### `LogicService.topLeftAfterRotation(parCenterX, parCenterY, point2X, point2Y, imgSizeX, imgSizeY, angle)`

Rotate an image/rectangle around a parent rotation point.

Returns:

```ts
{ x, y, xR, yR }
```

Use when an attached image/object needs both its rotated center and resulting top-left drawing position.

### `LogicService.getRectCords(p1x, p1y, p2x, p2y)`

Creates a normalized rectangle from any two points.

Returns:

```ts
{ x, y, sx, sy, x2, y2 }
```

Useful for mouse-drag selection boxes and arbitrary corner ordering.

### `LogicService.isPointInRectangle(point, rectangle)`

Checks whether a point lies inside a rectangle.

### `LogicService.isPointInCords(cord, cords)`

Convenience wrapper for checking a `Cord` against a `Cords` bounding box.

## Canvas Drawing

All drawing helpers operate directly on an HTML5 `CanvasRenderingContext2D`.

### `drawRotateImage(...)`

Draw an image rotated around a specified translation/rotation point.

Use this rather than manually implementing Canvas save/translate/rotate/restore logic.

### `drawRotateBorder(...)`

Draw a rotated rectangle border.

### `drawBorder(...)`

Draw a standard rectangle border.

### `drawBorderJustCorners(...)`

Draw only the corner portions of a rectangle.

### `drawBox(...)`

Draw a filled rectangle with a border.

### `drawNoBorder(...)`

Draw a filled rectangle without a border.

### `drawIsoBox(...)`

Draw a simple diamond/isometric-style box.

### `drawCircle(...)`

Draw a circle with optional fill/stroke. Supports `"DOTTED"` line style.

### `drawLine(...)`

Draw a line between two points.

### `drawPath(...)`

Draw a path from `(x + 32, y + 32)` to `(xx, yy)`. This has intentionally different starting behavior from `drawLine`.

### `writeOnCanvas(...)`

Basic Canvas text rendering using Century Gothic.

## Text Layout

### `writeInPixels(...)`

Draw text relative to a `Cords` region.

Supported alignment values include:

* `TOPLEFT`
* `TOPCENTER`
* `CENTER`
* `SIDEBARLEFT`
* `SIDEBARCENTER`

### `calculateChunks(...)`

Break text into drawable lines/chunks based on available width/height and alignment.

Returns:

```ts
Chunk[] // { x, y, text }
```

Useful when text needs to fit inside game UI panels.

## Math / Utility

### `RADIANCAL`

`180 / Math.PI`

### `DEGREECAL`

`Math.PI / 180`

### `radianToDegree(radians)`

Convert radians to degrees, normalized so negative values are shifted into the 0–360 range.

### `radianToDegreeFloor(radians)`

Same conversion, rounded down.

### `degreeToRadian(degrees)`

Convert degrees to radians.

### `posDiff(a, b)`

Return the positive/absolute difference between two numbers.

### `isDiffLessThan(value, shouldBeLessThan)`

Check whether the absolute value is below a threshold.

### `isDiffLessThanCalc(number1, number2, shouldBeLessThan)`

Check whether the absolute difference between two numbers is below a threshold.

### `getRandomInt(max)`

Returns an integer from `0` through `max - 1`.

### `shuffle(array)`

Shuffles an array in place and returns it.

### `incrementLoop(index, length, increment = 1)`

Increment an index and wrap it back to `0` when it reaches `length`.

### `Create2DArray(rows)`

Create an empty 2D array with the specified number of rows.

### `moveBetweenArrays(fromArray, toArray, func)`

Move array entries to another array when the supplied predicate returns `true`.

## Null Helpers

### `isNull(value)`

Returns `true` for `null` or `undefined`.

### `notNull(value)`

Inverse of `isNull`.

## Fixed Rotation Constants

`HardRotationAngle` provides common Canvas/game rotation values in radians:

```ts
UP    = -Math.PI / 2
DOWN  =  Math.PI / 2
LEFT  =  Math.PI
RIGHT =  0
```

## Agent Guidance

When implementing game features:

* **Use `LogicService` for existing geometry, rotation, Canvas drawing, text, and common math operations.**
* Do not create another generic rotation, rectangle, circle, line, degree/radian, or random utility if `LogicService` already provides it.
* Angles used by rotation methods are **radians**.
* Use `HardRotationAngle` when an object needs one of the four cardinal rotations.
* Use the existing `Cord` / `Cords` types for coordinate/bounding-box logic where appropriate.
* `LogicService` has **no dependencies** and is intended to be safely shared throughout the game.
