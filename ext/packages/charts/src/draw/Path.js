/**
 * Class representing a path.
 * Designed to be compatible with [CanvasPathMethods](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#canvaspathmethods)
 * and will hopefully be replaced by the browsers' implementation of the Path object.
 */
Ext.define('Ext.draw.Path', {
    requires: ['Ext.draw.Draw'],
    statics: {
        pathRe: /,?([achlmqrstvxz]),?/gi,
        pathRe2: /-/gi,
        pathSplitRe: /\s|,/g
    },
    svgString: '',

    /**
     * Create a path from pathString.
     * @constructor
     * @param {String} pathString
     */
    constructor: function(pathString) {
        var me = this;

        me.commands = []; // Stores command letters from the SVG path data ('d' attribute).
        me.params = [];   // Stores command parameters from the SVG path data.
        // All command parameters are actually point coordinates as the only commands used
        // are the M, L, C, Z. This makes path transformations and hit testing easier.
        // Arcs are approximated using cubic Bezier curves, H and S commands are translated
        // to L commands and relative commands are translated to their absolute versions.
        me.cursor = null;
        me.startX = 0;
        me.startY = 0;

        if (pathString) {
            me.fromSvgString(pathString);
        }
    },

    /**
     * Clear the path.
     */
    clear: function() {
        var me = this;

        me.params.length = 0;
        me.commands.length = 0;
        me.cursor = null;
        me.startX = 0;
        me.startY = 0;
        me.dirt();
    },

    /**
     * @private
     */
    dirt: function() {
        this.svgString = '';
    },

    /**
     * Move to a position.
     * @param {Number} x
     * @param {Number} y
     */
    moveTo: function(x, y) {
        var me = this;

        if (!me.cursor) {
            me.cursor = [x, y];
        }

        me.params.push(x, y);
        me.commands.push('M');
        me.startX = x;
        me.startY = y;
        me.cursor[0] = x;
        me.cursor[1] = y;
        me.dirt();
    },

    /**
     * A straight line to a position.
     * @param {Number} x
     * @param {Number} y
     */
    lineTo: function(x, y) {
        var me = this;

        if (!me.cursor) {
            me.cursor = [x, y];
            me.params.push(x, y);
            me.commands.push('M');
        }
        else {
            me.params.push(x, y);
            me.commands.push('L');
        }

        me.cursor[0] = x;
        me.cursor[1] = y;
        me.dirt();
    },

    /**
     * A cubic bezier curve to a position.
     * @param {Number} cx1
     * @param {Number} cy1
     * @param {Number} cx2
     * @param {Number} cy2
     * @param {Number} x
     * @param {Number} y
     */
    bezierCurveTo: function(cx1, cy1, cx2, cy2, x, y) {
        var me = this;

        if (!me.cursor) {
            me.moveTo(cx1, cy1);
        }

        me.params.push(cx1, cy1, cx2, cy2, x, y);
        me.commands.push('C');
        me.cursor[0] = x;
        me.cursor[1] = y;
        me.dirt();
    },

    /**
     * A quadratic bezier curve to a position.
     * @param {Number} cx
     * @param {Number} cy
     * @param {Number} x
     * @param {Number} y
     */
    quadraticCurveTo: function(cx, cy, x, y) {
        var me = this;

        if (!me.cursor) {
            me.moveTo(cx, cy);
        }

        me.bezierCurveTo(
            (2 * cx + me.cursor[0]) / 3, (2 * cy + me.cursor[1]) / 3,
            (2 * cx + x) / 3, (2 * cy + y) / 3,
            x, y
        );
    },

    /**
     * Close this path with a straight line.
     */
    closePath: function() {
        var me = this;

        if (me.cursor) {
            me.cursor = null;
            me.commands.push('Z');
            me.dirt();
        }
    },

    /**
     * Create a elliptic arc curve compatible with SVG's arc to instruction.
     *
     * The curve start from (`x1`, `y1`) and ends at (`x2`, `y2`). The ellipse
     * has radius `rx` and `ry` and a rotation of `rotation`.
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} x2
     * @param {Number} y2
     * @param {Number} [rx]
     * @param {Number} [ry]
     * @param {Number} [rotation]
     */
    arcTo: function(x1, y1, x2, y2, rx, ry, rotation) {
        var me = this;

        if (ry === undefined) {
            ry = rx;
        }

        if (rotation === undefined) {
            rotation = 0;
        }

        if (!me.cursor) {
            me.moveTo(x1, y1);

            return;
        }

        if (rx === 0 || ry === 0) {
            me.lineTo(x1, y1);

            return;
        }

        x2 -= x1;
        y2 -= y1;

        // eslint-disable-next-line vars-on-top
        var x0 = me.cursor[0] - x1,
            y0 = me.cursor[1] - y1,
            area = x2 * y0 - y2 * x0,
            cos, sin, xx, yx, xy, yy,
            l0 = Math.sqrt(x0 * x0 + y0 * y0),
            l2 = Math.sqrt(x2 * x2 + y2 * y2),
            dist, cx, cy,
            temp;

        // cos rx, -sin ry , x1 - cos rx x1 + ry sin y1
        // sin rx, cos ry, -rx sin x1 + y1 - cos ry y1
        if (area === 0) {
            me.lineTo(x1, y1);

            return;
        }

        if (ry !== rx) {
            cos = Math.cos(rotation);
            sin = Math.sin(rotation);
            xx = cos / rx;
            yx = sin / ry;
            xy = -sin / rx;
            yy = cos / ry;

            temp = xx * x0 + yx * y0;

            y0 = xy * x0 + yy * y0;
            x0 = temp;
            temp = xx * x2 + yx * y2;
            y2 = xy * x2 + yy * y2;
            x2 = temp;
        }
        else {
            x0 /= rx;
            y0 /= ry;
            x2 /= rx;
            y2 /= ry;
        }

        cx = x0 * l2 + x2 * l0;
        cy = y0 * l2 + y2 * l0;
        dist = 1 / (Math.sin(Math.asin(Math.abs(area) / (l0 * l2)) * 0.5) *
                    Math.sqrt(cx * cx + cy * cy));
        cx *= dist;
        cy *= dist;

        // eslint-disable-next-line vars-on-top
        var k0 = (cx * x0 + cy * y0) / (x0 * x0 + y0 * y0),
            k2 = (cx * x2 + cy * y2) / (x2 * x2 + y2 * y2),
            cosStart = x0 * k0 - cx,
            sinStart = y0 * k0 - cy,
            cosEnd = x2 * k2 - cx,
            sinEnd = y2 * k2 - cy,
            startAngle = Math.atan2(sinStart, cosStart),
            endAngle = Math.atan2(sinEnd, cosEnd);

        if (area > 0) {
            if (endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }
        }
        else {
            if (startAngle < endAngle) {
                startAngle += Math.PI * 2;
            }
        }

        if (ry !== rx) {
            cx = cos * cx * rx - sin * cy * ry + x1;
            cy = sin * cy * ry + cos * cy * ry + y1;
            me.lineTo(cos * rx * cosStart - sin * ry * sinStart + cx,
                      sin * rx * cosStart + cos * ry * sinStart + cy);
            me.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, area < 0);
        }
        else {
            cx = cx * rx + x1;
            cy = cy * ry + y1;
            me.lineTo(rx * cosStart + cx, ry * sinStart + cy);
            me.ellipse(cx, cy, rx, ry, rotation, startAngle, endAngle, area < 0);
        }
    },

    /**
     * Create an elliptic arc.
     *
     * See [the whatwg reference of ellipse](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-ellipse).
     *
     * @param {Number} cx
     * @param {Number} cy
     * @param {Number} radiusX
     * @param {Number} radiusY
     * @param {Number} rotation
     * @param {Number} startAngle
     * @param {Number} endAngle
     * @param {Number} anticlockwise
     */
    ellipse: function(cx, cy, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
        var me = this,
            params = me.params,
            start = params.length,
            count, temp, i, j;

        if (endAngle - startAngle >= Math.PI * 2) {
            me.ellipse(cx, cy, radiusX, radiusY, rotation, startAngle, startAngle + Math.PI,
                       anticlockwise);
            me.ellipse(cx, cy, radiusX, radiusY, rotation, startAngle + Math.PI, endAngle,
                       anticlockwise);

            return;
        }

        if (!anticlockwise) {
            if (endAngle < startAngle) {
                endAngle += Math.PI * 2;
            }

            count = me.approximateArc(params, cx, cy, radiusX, radiusY, rotation, startAngle,
                                      endAngle);
        }
        else {
            if (startAngle < endAngle) {
                startAngle += Math.PI * 2;
            }

            count = me.approximateArc(params, cx, cy, radiusX, radiusY, rotation, endAngle,
                                      startAngle);

            for (i = start, j = params.length - 2; i < j; i += 2, j -= 2) {
                temp = params[i];

                params[i] = params[j];
                params[j] = temp;
                temp = params[i + 1];
                params[i + 1] = params[j + 1];
                params[j + 1] = temp;
            }
        }

        if (!me.cursor) {
            me.cursor = [params[params.length - 2], params[params.length - 1]];
            me.commands.push('M');
        }
        else {
            me.cursor[0] = params[params.length - 2];
            me.cursor[1] = params[params.length - 1];
            me.commands.push('L');
        }

        for (i = 2; i < count; i += 6) {
            me.commands.push('C');
        }

        me.dirt();
    },

    /**
     * Create an circular arc.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} radius
     * @param {Number} startAngle
     * @param {Number} endAngle
     * @param {Number} anticlockwise
     */
    arc: function(x, y, radius, startAngle, endAngle, anticlockwise) {
        this.ellipse(x, y, radius, radius, 0, startAngle, endAngle, anticlockwise);
    },

    /**
     * Draw a rectangle and close it.
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} width
     * @param {Number} height
     */
    rect: function(x, y, width, height) {
        var me = this;

        if (width === 0 || height === 0) {
            return;
        }

        me.moveTo(x, y);
        me.lineTo(x + width, y);
        me.lineTo(x + width, y + height);
        me.lineTo(x, y + height);
        me.closePath();
    },

    /**
     * @private
     * @param {Array} result
     * @param {Number} cx
     * @param {Number} cy
     * @param {Number} rx
     * @param {Number} ry
     * @param {Number} phi
     * @param {Number} theta1
     * @param {Number} theta2
     * @return {Number}
     */
    approximateArc: function(result, cx, cy, rx, ry, phi, theta1, theta2) {
        var cosPhi = Math.cos(phi),
            sinPhi = Math.sin(phi),
            cosTheta1 = Math.cos(theta1),
            sinTheta1 = Math.sin(theta1),
            xx = cosPhi * cosTheta1 * rx - sinPhi * sinTheta1 * ry,
            yx = -cosPhi * sinTheta1 * rx - sinPhi * cosTheta1 * ry,
            xy = sinPhi * cosTheta1 * rx + cosPhi * sinTheta1 * ry,
            yy = -sinPhi * sinTheta1 * rx + cosPhi * cosTheta1 * ry,
            rightAngle = Math.PI / 2,
            count = 2,
            exx = xx,
            eyx = yx,
            exy = xy,
            eyy = yy,
            rho = 0.547443256150549,
            temp, y1, x3, y3, x2, y2;

        theta2 -= theta1;

        if (theta2 < 0) {
            theta2 += Math.PI * 2;
        }

        result.push(xx + cx, xy + cy);

        while (theta2 >= rightAngle) {
            result.push(
                exx + eyx * rho + cx, exy + eyy * rho + cy,
                exx * rho + eyx + cx, exy * rho + eyy + cy,
                eyx + cx, eyy + cy
            );
            count += 6;
            theta2 -= rightAngle;
            temp = exx;
            exx = eyx;
            eyx = -temp;
            temp = exy;
            exy = eyy;
            eyy = -temp;
        }

        if (theta2) {
            y1 = (0.3294738052815987 + 0.012120855841304373 * theta2) * theta2;
            x3 = Math.cos(theta2);
            y3 = Math.sin(theta2);
            x2 = x3 + y1 * y3;
            y2 = y3 - y1 * x3;
            result.push(
                exx + eyx * y1 + cx, exy + eyy * y1 + cy,
                exx * x2 + eyx * y2 + cx, exy * x2 + eyy * y2 + cy,
                exx * x3 + eyx * y3 + cx, exy * x3 + eyy * y3 + cy
            );
            count += 6;
        }

        return count;
    },

    /**
     * [http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes](http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes)
     * @param {Number} rx
     * @param {Number} ry
     * @param {Number} rotation Differ from svg spec, this is radian.
     * @param {Number} fA
     * @param {Number} fS
     * @param {Number} x2
     * @param {Number} y2
     */
    arcSvg: function(rx, ry, rotation, fA, fS, x2, y2) {
        if (rx < 0) {
            rx = -rx;
        }

        if (ry < 0) {
            ry = -ry;
        }

        // eslint-disable-next-line vars-on-top
        var me = this,
            x1 = me.cursor[0],
            y1 = me.cursor[1],
            hdx = (x1 - x2) / 2,
            hdy = (y1 - y2) / 2,
            cosPhi = Math.cos(rotation),
            sinPhi = Math.sin(rotation),
            xp = hdx * cosPhi + hdy * sinPhi,
            yp = -hdx * sinPhi + hdy * cosPhi,
            ratX = xp / rx,
            ratY = yp / ry,
            lambda = ratX * ratX + ratY * ratY,
            cx = (x1 + x2) * 0.5,
            cy = (y1 + y2) * 0.5,
            cpx = 0,
            cpy = 0,
            theta1, deltaTheta;

        if (lambda >= 1) {
            lambda = Math.sqrt(lambda);
            rx *= lambda;
            ry *= lambda;
            // me gives lambda == cpx == cpy == 0;
        }
        else {
            lambda = Math.sqrt(1 / lambda - 1);

            if (fA === fS) {
                lambda = -lambda;
            }

            cpx = lambda * rx * ratY;
            cpy = -lambda * ry * ratX;
            cx += cosPhi * cpx - sinPhi * cpy;
            cy += sinPhi * cpx + cosPhi * cpy;
        }

        theta1 = Math.atan2((yp - cpy) / ry, (xp - cpx) / rx);
        deltaTheta = Math.atan2((-yp - cpy) / ry, (-xp - cpx) / rx) - theta1;

        if (fS) {
            if (deltaTheta <= 0) {
                deltaTheta += Math.PI * 2;
            }
        }
        else {
            if (deltaTheta >= 0) {
                deltaTheta -= Math.PI * 2;
            }
        }

        me.ellipse(cx, cy, rx, ry, rotation, theta1, theta1 + deltaTheta, 1 - fS);
    },

    /**
     * Feed the path from svg path string.
     * @param {String} pathString
     */
    fromSvgString: function(pathString) {
        if (!pathString) {
            return;
        }

        // eslint-disable-next-line vars-on-top
        var me = this,
            parts,
            paramCounts = {
                a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0,
                A: 7, C: 6, H: 1, L: 2, M: 2, Q: 4, S: 4, T: 2, V: 1, Z: 0
            },
            lastCommand = '',
            lastControlX, lastControlY,
            lastX = 0,
            lastY = 0,
            part = false,
            i, partLength;

        // Split the string to items.
        if (Ext.isString(pathString)) {
            parts = pathString.replace(Ext.draw.Path.pathRe, " $1 ")
                              .replace(Ext.draw.Path.pathRe2, " -")
                              .split(Ext.draw.Path.pathSplitRe);
        }
        else if (Ext.isArray(pathString)) {
            parts = pathString.join(',').split(Ext.draw.Path.pathSplitRe);
        }

        // Remove empty entries
        for (i = 0, partLength = 0; i < parts.length; i++) {
            if (parts[i] !== '') {
                parts[partLength++] = parts[i];
            }
        }

        parts.length = partLength;

        me.clear();

        for (i = 0; i < parts.length;) {
            lastCommand = part;
            part = parts[i];
            i++;

            switch (part) {
                case 'M':
                    me.moveTo(lastX = +parts[i], lastY = +parts[i + 1]);
                    i += 2;

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX = +parts[i], lastY = +parts[i + 1]);
                        i += 2;
                    }

                    break;

                case 'L':
                    me.lineTo(lastX = +parts[i], lastY = +parts[i + 1]);
                    i += 2;

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX = +parts[i], lastY = +parts[i + 1]);
                        i += 2;
                    }

                    break;

                case 'A':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.arcSvg(
                            +parts[i], +parts[i + 1],
                            +parts[i + 2] * Math.PI / 180,
                            +parts[i + 3], +parts[i + 4],
                            lastX = +parts[i + 5], lastY = +parts[i + 6]);
                        i += 7;
                    }

                    break;

                case 'C':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.bezierCurveTo(
                            +parts[i], +parts[i + 1],
                            lastControlX = +parts[i + 2], lastControlY = +parts[i + 3],
                            lastX = +parts[i + 4], lastY = +parts[i + 5]);
                        i += 6;
                    }

                    break;

                case 'Z':
                    me.closePath();
                    break;

                case 'm':
                    me.moveTo(lastX += +parts[i], lastY += +parts[i + 1]);
                    i += 2;

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX += +parts[i], lastY += +parts[i + 1]);
                        i += 2;
                    }

                    break;

                case 'l':
                    me.lineTo(lastX += +parts[i], lastY += +parts[i + 1]);
                    i += 2;

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX += +parts[i], lastY += +parts[i + 1]);
                        i += 2;
                    }

                    break;

                case 'a':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.arcSvg(
                            +parts[i], +parts[i + 1],
                            +parts[i + 2] * Math.PI / 180,
                            +parts[i + 3], +parts[i + 4],
                            lastX += +parts[i + 5], lastY += +parts[i + 6]);
                        i += 7;
                    }

                    break;

                case 'c':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.bezierCurveTo(lastX + (+parts[i]), lastY + (+parts[i + 1]),
                                         lastControlX = lastX + (+parts[i + 2]),
                                         lastControlY = lastY + (+parts[i + 3]),
                                         lastX += +parts[i + 4], lastY += +parts[i + 5]);
                        i += 6;
                    }

                    break;

                case 'z':
                    me.closePath();
                    break;

                case 's':
                    if (!(lastCommand === 'c' || lastCommand === 'C' || lastCommand === 's' ||
                        lastCommand === 'S')) {
                        lastControlX = lastX;
                        lastControlY = lastY;
                    }

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.bezierCurveTo(
                            lastX + lastX - lastControlX, lastY + lastY - lastControlY,
                            lastControlX = lastX + (+parts[i]), lastControlY = lastY +
                                           (+parts[i + 1]),
                            lastX += +parts[i + 2], lastY += +parts[i + 3]);
                        i += 4;
                    }

                    break;

                case 'S':
                    if (!(lastCommand === 'c' || lastCommand === 'C' || lastCommand === 's' ||
                        lastCommand === 'S')) {
                        lastControlX = lastX;
                        lastControlY = lastY;
                    }

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.bezierCurveTo(
                            lastX + lastX - lastControlX, lastY + lastY - lastControlY,
                            lastControlX = +parts[i], lastControlY = +parts[i + 1],
                            lastX = (+parts[i + 2]), lastY = (+parts[i + 3]));
                        i += 4;
                    }

                    break;

                case 'q':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.quadraticCurveTo(
                            lastControlX = lastX + (+parts[i]),
                            lastControlY = lastY + (+parts[i + 1]),
                            lastX += +parts[i + 2], lastY += +parts[i + 3]);
                        i += 4;
                    }

                    break;

                case 'Q':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.quadraticCurveTo(
                            lastControlX = +parts[i], lastControlY = +parts[i + 1],
                            lastX = +parts[i + 2], lastY = +parts[i + 3]);
                        i += 4;
                    }

                    break;

                case 't':
                    if (!(lastCommand === 'q' || lastCommand === 'Q' || lastCommand === 't' ||
                        lastCommand === 'T')) {
                        lastControlX = lastX;
                        lastControlY = lastY;
                    }

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.quadraticCurveTo(
                            lastControlX = lastX + lastX - lastControlX,
                            lastControlY = lastY + lastY - lastControlY,
                            lastX += +parts[i + 1], lastY += +parts[i + 2]);
                        i += 2;
                    }

                    break;

                case 'T':
                    if (!(lastCommand === 'q' || lastCommand === 'Q' || lastCommand === 't' ||
                        lastCommand === 'T')) {
                        lastControlX = lastX;
                        lastControlY = lastY;
                    }

                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.quadraticCurveTo(
                            lastControlX = lastX + lastX - lastControlX,
                            lastControlY = lastY + lastY - lastControlY,
                            lastX = (+parts[i + 1]), lastY = (+parts[i + 2]));
                        i += 2;
                    }

                    break;

                case 'h':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX += +parts[i], lastY);
                        i++;
                    }

                    break;

                case 'H':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX = +parts[i], lastY);
                        i++;
                    }

                    break;

                case 'v':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX, lastY += +parts[i]);
                        i++;
                    }

                    break;

                case 'V':
                    while (i < partLength && !paramCounts.hasOwnProperty(parts[i])) {
                        me.lineTo(lastX, lastY = +parts[i]);
                        i++;
                    }

                    break;
            }
        }
    },

    /**
     * Clone this path.
     * @return {Ext.draw.Path}
     */
    clone: function() {
        var me = this,
            path = new Ext.draw.Path();

        path.params = me.params.slice(0);
        path.commands = me.commands.slice(0);
        path.cursor = me.cursor ? me.cursor.slice(0) : null;
        path.startX = me.startX;
        path.startY = me.startY;
        path.svgString = me.svgString;

        return path;
    },

    /**
     * Transform the current path by a matrix.
     * @param {Ext.draw.Matrix} matrix
     */
    transform: function(matrix) {
        if (matrix.isIdentity()) {
            return;
        }

        // eslint-disable-next-line vars-on-top
        var xx = matrix.getXX(),
            yx = matrix.getYX(),
            dx = matrix.getDX(),
            xy = matrix.getXY(),
            yy = matrix.getYY(),
            dy = matrix.getDY(),
            params = this.params,
            i = 0,
            ln = params.length,
            x, y;

        for (; i < ln; i += 2) {
            x = params[i];
            y = params[i + 1];
            params[i] = x * xx + y * yx + dx;
            params[i + 1] = x * xy + y * yy + dy;
        }

        this.dirt();
    },

    /**
     * Get the bounding box of this matrix.
     * @param {Object} [target] Optional object to receive the result.
     *
     * @return {Object} Object with x, y, width and height
     */
    getDimension: function(target) {
        if (!target) {
            target = {};
        }

        if (!this.commands || !this.commands.length) {
            target.x = 0;
            target.y = 0;
            target.width = 0;
            target.height = 0;

            return target;
        }

        target.left = Infinity;
        target.top = Infinity;
        target.right = -Infinity;
        target.bottom = -Infinity;

        // eslint-disable-next-line vars-on-top
        var i = 0,
            j = 0,
            commands = this.commands,
            params = this.params,
            ln = commands.length,
            x, y;

        for (; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                case 'L':
                    x = params[j];
                    y = params[j + 1];
                    target.left = Math.min(x, target.left);
                    target.top = Math.min(y, target.top);
                    target.right = Math.max(x, target.right);
                    target.bottom = Math.max(y, target.bottom);
                    j += 2;
                    break;

                case 'C':
                    this.expandDimension(target, x, y,
                                         params[j], params[j + 1],
                                         params[j + 2], params[j + 3],
                                         x = params[j + 4], y = params[j + 5]);
                    j += 6;
                    break;
            }
        }

        target.x = target.left;
        target.y = target.top;
        target.width = target.right - target.left;
        target.height = target.bottom - target.top;

        return target;
    },

    /**
     * Get the bounding box as if the path is transformed by a matrix.
     *
     * @param {Ext.draw.Matrix} matrix
     * @param {Object} [target] Optional object to receive the result.
     *
     * @return {Object} An object with x, y, width and height.
     */
    getDimensionWithTransform: function(matrix, target) {
        if (!this.commands || !this.commands.length) {
            if (!target) {
                target = {};
            }

            target.x = 0;
            target.y = 0;
            target.width = 0;
            target.height = 0;

            return target;
        }

        target.left = Infinity;
        target.top = Infinity;
        target.right = -Infinity;
        target.bottom = -Infinity;

        // eslint-disable-next-line vars-on-top
        var xx = matrix.getXX(),
            yx = matrix.getYX(),
            dx = matrix.getDX(),
            xy = matrix.getXY(),
            yy = matrix.getYY(),
            dy = matrix.getDY(),
            i = 0,
            j = 0,
            commands = this.commands,
            params = this.params,
            ln = commands.length,
            x, y;

        for (; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                case 'L':
                    x = params[j] * xx + params[j + 1] * yx + dx;
                    y = params[j] * xy + params[j + 1] * yy + dy;
                    target.left = Math.min(x, target.left);
                    target.top = Math.min(y, target.top);
                    target.right = Math.max(x, target.right);
                    target.bottom = Math.max(y, target.bottom);
                    j += 2;
                    break;

                case 'C':
                    this.expandDimension(target,
                                         x, y,
                                         params[j] * xx + params[j + 1] * yx + dx,
                                         params[j] * xy + params[j + 1] * yy + dy,
                                         params[j + 2] * xx + params[j + 3] * yx + dx,
                                         params[j + 2] * xy + params[j + 3] * yy + dy,
                                         x = params[j + 4] * xx + params[j + 5] * yx + dx,
                                         y = params[j + 4] * xy + params[j + 5] * yy + dy);
                    j += 6;
                    break;
            }
        }

        if (!target) {
            target = {};
        }

        target.x = target.left;
        target.y = target.top;
        target.width = target.right - target.left;
        target.height = target.bottom - target.top;

        return target;
    },

    /**
     * @private
     * Expand the rect by the bbox of a bezier curve.
     *
     * @param {Object} target
     * @param {Number} x1
     * @param {Number} y1
     * @param {Number} cx1
     * @param {Number} cy1
     * @param {Number} cx2
     * @param {Number} cy2
     * @param {Number} x2
     * @param {Number} y2
     */
    expandDimension: function(target, x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
        var me = this,
            l = target.left,
            r = target.right,
            t = target.top,
            b = target.bottom,
            dim = me.dim || (me.dim = []);

        me.curveDimension(x1, cx1, cx2, x2, dim);
        l = Math.min(l, dim[0]);
        r = Math.max(r, dim[1]);

        me.curveDimension(y1, cy1, cy2, y2, dim);
        t = Math.min(t, dim[0]);
        b = Math.max(b, dim[1]);

        target.left = l;
        target.right = r;
        target.top = t;
        target.bottom = b;
    },

    /**
     * @private
     * Determine the curve
     * @param {Number} a
     * @param {Number} b
     * @param {Number} c
     * @param {Number} d
     * @param {Number} dim
     */
    curveDimension: function(a, b, c, d, dim) {
        var qa = 3 * (-a + 3 * (b - c) + d),
            qb = 6 * (a - 2 * b + c),
            qc = -3 * (a - b),
            x, y,
            min = Math.min(a, d),
            max = Math.max(a, d),
            delta;

        if (qa === 0) {
            if (qb === 0) {
                dim[0] = min;
                dim[1] = max;

                return;
            }
            else {
                x = -qc / qb;

                if (0 < x && x < 1) {
                    y = this.interpolate(a, b, c, d, x);
                    min = Math.min(min, y);
                    max = Math.max(max, y);
                }
            }
        }
        else {
            delta = qb * qb - 4 * qa * qc;

            if (delta >= 0) {
                delta = Math.sqrt(delta);
                x = (delta - qb) / 2 / qa;

                if (0 < x && x < 1) {
                    y = this.interpolate(a, b, c, d, x);
                    min = Math.min(min, y);
                    max = Math.max(max, y);
                }

                if (delta > 0) {
                    x -= delta / qa;

                    if (0 < x && x < 1) {
                        y = this.interpolate(a, b, c, d, x);
                        min = Math.min(min, y);
                        max = Math.max(max, y);
                    }
                }
            }
        }

        dim[0] = min;
        dim[1] = max;
    },

    /**
     * @private
     *
     * Returns `a * (1 - t) ^ 3 + 3 * b (1 - t) ^ 2 * t + 3 * c (1 - t) * t ^ 3 + d * t ^ 3`.
     *
     * @param {Number} a
     * @param {Number} b
     * @param {Number} c
     * @param {Number} d
     * @param {Number} t
     * @return {Number}
     */
    interpolate: function(a, b, c, d, t) {
        var rate;

        if (t === 0) {
            return a;
        }

        if (t === 1) {
            return d;
        }

        rate = (1 - t) / t;

        return t * t * t * (d + rate * (3 * c + rate * (3 * b + rate * a)));
    },

    /**
     * Reconstruct path from cubic bezier curve stripes.
     * @param {Array} stripes
     */
    fromStripes: function(stripes) {
        var me = this,
            i = 0,
            ln = stripes.length,
            j, ln2, stripe;

        me.clear();

        for (; i < ln; i++) {
            stripe = stripes[i];
            me.params.push.apply(me.params, stripe);
            me.commands.push('M');

            for (j = 2, ln2 = stripe.length; j < ln2; j += 6) {
                me.commands.push('C');
            }
        }

        if (!me.cursor) {
            me.cursor = [];
        }

        me.cursor[0] = me.params[me.params.length - 2];
        me.cursor[1] = me.params[me.params.length - 1];
        me.dirt();
    },

    /**
     * Convert path to bezier curve stripes.
     * @param {Array} [target] The optional array to receive the result.
     * @return {Array}
     */
    toStripes: function(target) {
        var stripes = target || [],
            curr,
            x, y, lastX, lastY, startX, startY,
            i, j,
            commands = this.commands,
            params = this.params,
            ln = commands.length;

        for (i = 0, j = 0; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                    curr = [startX = lastX = params[j++], startY = lastY = params[j++]];
                    stripes.push(curr);
                    break;

                case 'L':
                    x = params[j++];
                    y = params[j++];
                    curr.push((lastX + lastX + x) / 3, (lastY + lastY + y) / 3,
                              (lastX + x + x) / 3, (lastY + y + y) / 3, lastX = x, lastY = y);
                    break;

                case 'C':
                    curr.push(params[j++], params[j++], params[j++], params[j++],
                              lastX = params[j++], lastY = params[j++]);
                    break;

                case 'Z':
                    x = startX;
                    y = startY;
                    curr.push((lastX + lastX + x) / 3, (lastY + lastY + y) / 3,
                              (lastX + x + x) / 3, (lastY + y + y) / 3, lastX = x, lastY = y);
                    break;
            }
        }

        return stripes;
    },

    /**
     * @private
     * Update cache for svg string of this path.
     */
    updateSvgString: function() {
        var result = [],
            commands = this.commands,
            params = this.params,
            ln = commands.length,
            i = 0,
            j = 0;

        for (; i < ln; i++) {
            switch (commands[i]) {
                case 'M':
                    result.push('M' + params[j] + ',' + params[j + 1]);
                    j += 2;
                    break;

                case 'L':
                    result.push('L' + params[j] + ',' + params[j + 1]);
                    j += 2;
                    break;

                case 'C':
                    result.push('C' + params[j] + ',' + params[j + 1] + ' ' +
                        params[j + 2] + ',' + params[j + 3] + ' ' +
                        params[j + 4] + ',' + params[j + 5]);
                    j += 6;
                    break;

                case 'Z':
                    result.push('Z');
                    break;
            }
        }

        this.svgString = result.join('');
    },

    /**
     * Return an svg path string for this path.
     * @return {String}
     */
    toString: function() {
        if (!this.svgString) {
            this.updateSvgString();
        }

        return this.svgString;
    }
});
