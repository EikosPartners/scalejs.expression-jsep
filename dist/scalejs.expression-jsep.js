'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.evaluate = exports.getIdentifiers = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _jsep = require('jsep');

var _jsep2 = _interopRequireDefault(_jsep);

var _knockout = require('knockout');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getIdentifiers(term) {
    // TODO: error checking for poorly formatted expressions
    try {
        var parseTree = (0, _jsep2.default)(term);
    } catch (ex) {
        console.warn('Left term is poorly formatted: ' + term);
        return [];
    }

    var ids = [];
    //console.log(parseTree);
    function collectIds(tree) {
        Object.keys(tree).forEach(function (key) {
            if (key === 'left' || key === 'right' || key === 'argument') {
                if (tree[key].type === 'Identifier') {
                    // check for uniqueness o f idntifier
                    if (ids.indexOf(tree[key].name) === -1) {
                        ids.push(tree[key].name);
                    }
                } else {
                    collectIds(tree[key]);
                }
            }
        });
    }

    collectIds(parseTree);
    return ids;
}

function internalEval(value) {
    return value === 'true' || value === true ? true : value === 'false' || value === false ? false : value === '' || value === null ? '""' : value === 'undefined' || value === undefined ? undefined : isFinite(Number(value)) ? Number(value) : (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' ? JSON.stringify(value) : '"' + value + '"';
}

function evaluate(term, mapFunc, opts) {

    opts = opts || {};
    opts.binary = opts.binary || {};
    opts.unary = opts.unary || {};

    Object.keys(opts.binary).forEach(function (op) {
        _jsep2.default.addBinaryOp(op, 10);
    });
    Object.keys(opts.unary).forEach(function (op) {
        _jsep2.default.addUnaryOp(op);
    });

    var parseTree;
    try {
        parseTree = (0, _jsep2.default)(term);
    } catch (ex) {
        console.error('error evaluating expr: ' + term, ex);
        return '';
    }

    Object.keys(opts.binary).forEach(function (op) {
        _jsep2.default.removeBinaryOp(op);
    });
    Object.keys(opts.unary).forEach(function (op) {
        _jsep2.default.removeUnaryOp(op);
    });

    function expr(tree) {
        var returnVal, left, right, test, consequent, alternate;

        switch (tree.type) {
            case 'BinaryExpression':
                left = expr(tree.left);
                right = expr(tree.right);

                left = internalEval(left);
                right = internalEval(right);;

                tree.left.value = left;
                tree.right.value = right;

                try {
                    if (Object.keys(opts.binary).indexOf(tree.operator) > -1) {
                        returnVal = opts.binary[tree.operator](left, right);
                    } else if (opts.evaluate) {
                        returnVal = opts.evaluate(tree.operator, left, right);
                    } else {
                        returnVal = eval(left + ' ' + tree.operator + ' ' + right);
                    }
                } catch (ex) {
                    console.error('error parsing expr:', parseTree, ex);
                    return '';
                }
                //console.log('binary:', tree.left.value, tree.operator, tree.right.value, returnVal);
                return returnVal;
            case 'UnaryExpression':
                var value = expr(tree.argument);
                value = internalEval(value);
                tree.argument.value = value;
                try {
                    if (Object.keys(opts.unary).indexOf(tree.operator) > -1) {
                        returnVal = opts.unary[tree.operator](tree.argument);
                    } else if (opts.evaluate) {
                        returnVal = opts.evaluate(tree.operator, tree.argument);
                    } else {
                        returnVal = eval(tree.operator + tree.argument.value);
                    }
                } catch (ex) {
                    console.error('error parsing expr:', parseTree, ex);
                    return '';
                }
                //console.log('unary:', tree.operator, tree.argument.value, returnVal);
                return returnVal;
            case 'LogicalExpression':
                left = expr(tree.left);
                left = internalEval(left);
                tree.left.value = left;

                if (tree.operator === '&&' && !left || tree.operator === '||' && left) {
                    //short-circuit
                    try {
                        returnVal = eval(left);
                    } catch (ex) {
                        console.error('There was an error when parsing expression', parseTree, ex);
                        return '';
                    }
                } else {
                    right = expr(tree.right);
                    right = internalEval(right);
                    tree.right.value = right;

                    try {
                        returnVal = eval(left + tree.operator + right);
                    } catch (ex) {
                        console.error('There was an error when parsing expression', parseTree, ex);
                        return '';
                    }
                }

                //console.log('Logical Operation:', tree.left.value, tree.operator, tree.right.value, returnVal);
                return returnVal;
            case 'Identifier':
                returnVal = mapFunc(tree.name);
                return returnVal;
            case 'Literal':
                returnVal = tree.value;
                return returnVal;
            case 'MemberExpression':
                tree.object = expr(tree.object);
                // unwrap is used as an object may have observable values..?
                if (tree.property.type == 'Identifier') {
                    tree.property.value = tree.property.name;
                } else {
                    tree.property.value = expr(tree.property);
                }
                returnVal = (0, _knockout.unwrap)((tree.object || {})[tree.property.value]);
                return returnVal;
            case 'CallExpression':
                returnVal = '';
                var callee = expr(tree.callee);
                tree.arguments = tree.arguments.map(function (arg) {
                    return expr(arg);
                });
                if (callee instanceof Function) {
                    returnVal = callee.apply(tree.callee.object, tree.arguments);
                }
                return returnVal;
            case 'ArrayExpression':
                returnVal = tree.elements.map(function (arg) {
                    return expr(arg);
                });
                return returnVal;
            case 'ConditionalExpression':
                test = expr(tree.test);
                if (test) {
                    returnVal = expr(tree.consequent);
                } else {
                    returnVal = expr(tree.alternate);
                }
                return returnVal;
            default:
                return tree.value;
        }
    }

    return expr(parseTree);
}

exports.getIdentifiers = getIdentifiers;
exports.evaluate = evaluate;
//# sourceMappingURL=scalejs.expression-jsep.js.map