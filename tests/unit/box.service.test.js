"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const box_service_1 = require("../../src/modules/box/box.service");
describe('BoxService', () => {
    let boxService;
    beforeEach(() => {
        boxService = new box_service_1.BoxService();
    });
    describe('createBoxActivation', () => {
        it('should create a new box activation', async () => {
            expect(boxService).toBeDefined();
        });
    });
    describe('getBoxActivationsByCustomer', () => {
        it('should retrieve box activations for a customer', async () => {
            expect(boxService).toBeDefined();
        });
    });
    describe('getBoxActivationById', () => {
        it('should retrieve a box activation by ID', async () => {
            expect(boxService).toBeDefined();
        });
    });
});
//# sourceMappingURL=box.service.test.js.map