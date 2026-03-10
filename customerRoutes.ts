import express, { Request, Response } from 'express';

const router = express.Router();

interface Customer {
    id: number;
    name: string;
    email: string;
    credit: number;
}

let customers: Customer[] = [];
let currentId = 1;

// Create Customer
router.post('/customers', (req: Request, res: Response) => {
    const { name, email, credit } = req.body;
    const newCustomer: Customer = { id: currentId++, name, email, credit };
    customers.push(newCustomer);
    res.status(201).json(newCustomer);
});

// Update Customer
router.put('/customers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, credit } = req.body;
    
    const customer = customers.find(c => c.id === Number(id));
    if (customer) {
        customer.name = name;
        customer.email = email;
        customer.credit = credit;
        res.json(customer);
    } else {
        res.status(404).json({ message: 'Customer not found' });
    }
});

// Delete Customer
router.delete('/customers/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    customers = customers.filter(c => c.id !== Number(id));
    res.status(204).send();
});

// List Customers
router.get('/customers', (req: Request, res: Response) => {
    res.json(customers);
});

// Manage Customer Credit
router.patch('/customers/:id/credit', (req: Request, res: Response) => {
    const { id } = req.params;
    const { credit } = req.body;

    const customer = customers.find(c => c.id === Number(id));
    if (customer) {
        customer.credit += credit;
        res.json(customer);
    } else {
        res.status(404).json({ message: 'Customer not found' });
    }
});

export default router;