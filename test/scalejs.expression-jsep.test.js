define([
    'scalejs.core', 'scalejs.application'
], function(
    core
) {
    var expression = core.expression;

    // For deeper testing, log to console
    console.log('core.expression: ', expression);

    describe('core.expression', function() {

        it('is defined', function() {
            expect(expression).toBeDefined();
        });

    });
});

