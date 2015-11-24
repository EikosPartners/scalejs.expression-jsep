
define('scalejs.expression-jsep',[
    'scalejs!core',
    'jsep',
    'knockout'
], function (
    core,
    jsep,
    ko
) {
    'use strict';

    var is = core.type.is;

    function getIdentifiers(term) {
        // TODO: error checking for poorly formatted expressions
        try {
            var parseTree = jsep(term);
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

    function evaluate(term, mapFunc, opts) {

        opts = opts || { };
        opts.binary = opts.binary || { };
        opts.unary = opts.unary || { };

        Object.keys(opts.binary).forEach(function (op) {
            jsep.addBinaryOp(op, 10);
        });
        Object.keys(opts.unary).forEach(function (op) {
            jsep.addUnaryOp(op);
        });

        var parseTree;
        try {
            parseTree = jsep(term);
        } catch (ex) {
            console.error('error evaluating expr: ' + term, ex);
            return '';
        }

        Object.keys(opts.binary).forEach(function (op) {
            jsep.removeBinaryOp(op);
        });
        Object.keys(opts.unary).forEach(function (op) {
            jsep.removeUnaryOp(op);
        });


        function expr(tree) {
            var returnVal,
                left,
                right;

            switch (tree.type) {
                case 'BinaryExpression':
                    left = expr(tree.left);
                    right = expr(tree.right);
                    
                    left =  left === 'true'  || left === true ? true :
                            left === 'false' || left === false ? false :
                            left === '' || left === null ? '""' :
                            isFinite(Number(left)) ? Number(left) :
                            '"' + left + '"';
                    right = right === 'true' || right === true ? true :
                            right === 'false' || right === false ? false :
                            right === '' || right === null ? '""' :
                            isFinite(Number(right)) ? Number(right) :
                            '"' + right + '"';

                    tree.left.value = left;
                    tree.right.value = right;

                    try {
                        if (Object.keys(opts.binary).indexOf(tree.operator) > -1) {
                            returnVal = opts.binary[tree.operator](left, right);
                        } else if (opts.evaluate) {
                            returnVal = opts.evaluate(tree.operator, left, right);
                        } else {
                        returnVal = eval(left + tree.operator + right);
                        }
                    } catch (ex) {
                        console.error('error parsing expr:', parseTree, ex);
                        return '';
                    }
                    //console.log('binary:', tree.left.value, tree.operator, tree.right.value, returnVal);
                    return returnVal;

                case 'UnaryExpression':
                    tree.argument.value = Number(expr(tree.argument)) || 0;
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
                    console.log('unary:', tree.operator, tree.argument.value, returnVal);
                    return returnVal;
                case 'LogicalExpression':
                    left = expr(tree.left);
                    right = expr(tree.right);

                    left = left === 'true' || left === true ? true :
                            left === 'false' || left === false ? false :
                            left === '' || left === null  ? '""' :
                            isFinite(Number(left)) ? Number(left) :
                            '"' + left + '"';
                    right = right === 'true' || right === true ? true :
                            right === 'false' || right === false ? false :
                            right === '' || right === null ? '""' :
                            isFinite(Number(right)) ? Number(right) :
                            '"' + right + '"';

                    tree.left.value = left;
                    tree.right.value = right;

                    try {
                        returnVal = eval(left + tree.operator + right);
                    } catch (ex) {
                        console.error('There was an error when parsing expression', parseTree, ex);
                        return '';
                    }
                    console.log('Logical Operation:', tree.left.value, tree.operator, tree.right.value, returnVal);
                    return returnVal;
                case 'Identifier':
                    returnVal = mapFunc(tree.name);
                    return returnVal;
                case 'MemberExpression':
                    tree.object = expr(tree.object);
                    // unwrap is used as an object may have observable values..?
                    if (tree.property.type == 'Identifier') {
                        tree.property.value = tree.property.name;
                    } else {
                        tree.property.value = expr(tree.property);
                    }
                    returnVal = ko.unwrap((tree.object||{})[tree.property.value]);    
                    return returnVal;
                default:
                    return tree.value;
            }
        }

        return expr(parseTree);
    }

    core.registerExtension({
        expression: {
            getIdentifiers: getIdentifiers,
            evaluate: evaluate
        }
    });
});

