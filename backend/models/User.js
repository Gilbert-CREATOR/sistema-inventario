const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

class User {
    constructor(data) {
        this.id = data.id || uuidv4();
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.role = data.role || 'customer';
        this.name = data.name || '';
        this.active = data.active !== undefined ? data.active : true;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastLogin = data.lastLogin || null;
        this.profile = data.profile || {
            phone: '',
            address: '',
            city: '',
            country: ''
        };
    }

    // Obtener todos los usuarios
    static async getAll() {
        try {
            const data = await fs.readFile(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Crear archivo con usuarios por defecto si no existe
                await User.createDefaultUsers();
                const data = await fs.readFile(USERS_FILE, 'utf8');
                return JSON.parse(data);
            }
            throw error;
        }
    }

    // Obtener usuario por ID
    static async findById(id) {
        const users = await User.getAll();
        return users.find(user => user.id === id);
    }

    // Obtener usuario por username o email
    static async findByUsernameOrEmail(usernameOrEmail) {
        const users = await User.getAll();
        return users.find(user => 
            user.username === usernameOrEmail || 
            user.email === usernameOrEmail
        );
    }

    // Crear nuevo usuario
    static async create(userData) {
        const users = await User.getAll();
        
        // Verificar si el username o email ya existe
        const existingUser = users.find(user => 
            user.username === userData.username || 
            user.email === userData.email
        );

        if (existingUser) {
            throw new Error('El username o email ya está en uso');
        }

        // Hashear password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

        const newUser = new User({
            ...userData,
            password: hashedPassword
        });

        users.push(newUser);
        await User.save(users);

        // Retornar usuario sin password
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    // Actualizar usuario
    static async update(id, updateData) {
        const users = await User.getAll();
        const userIndex = users.findIndex(user => user.id === id);

        if (userIndex === -1) {
            throw new Error('Usuario no encontrado');
        }

        // Si se está actualizando el password, hashearlo
        if (updateData.password) {
            const saltRounds = 10;
            updateData.password = await bcrypt.hash(updateData.password, saltRounds);
        }

        users[userIndex] = { ...users[userIndex], ...updateData };
        await User.save(users);

        // Retornar usuario sin password
        const { password, ...userWithoutPassword } = users[userIndex];
        return userWithoutPassword;
    }

    // Eliminar usuario (desactivar)
    static async deactivate(id) {
        return await User.update(id, { active: false });
    }

    // Activar usuario
    static async activate(id) {
        return await User.update(id, { active: true });
    }

    // Verificar password
    static async verifyPassword(user, password) {
        return await bcrypt.compare(password, user.password);
    }

    // Guardar usuarios en archivo
    static async save(users) {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    }

    // Crear usuarios por defecto
    static async createDefaultUsers() {
        const defaultUsers = [
            {
                username: 'superadmin',
                email: 'superadmin@sistema.com',
                password: 'admin123',
                role: 'superadmin',
                name: 'Super Administrador',
                profile: {
                    phone: '',
                    address: '',
                    city: '',
                    country: ''
                }
            },
            {
                username: 'admin',
                email: 'admin@sistema.com',
                password: 'admin123',
                role: 'admin',
                name: 'Administrador',
                profile: {
                    phone: '',
                    address: '',
                    city: '',
                    country: ''
                }
            },
            {
                username: 'employee',
                email: 'employee@sistema.com',
                password: 'employee123',
                role: 'employee',
                name: 'Empleado',
                profile: {
                    phone: '',
                    address: '',
                    city: '',
                    country: ''
                }
            },
            {
                username: 'customer',
                email: 'customer@sistema.com',
                password: 'customer123',
                role: 'customer',
                name: 'Cliente Demo',
                profile: {
                    phone: '',
                    address: '',
                    city: '',
                    country: ''
                }
            }
        ];

        const users = [];
        for (const userData of defaultUsers) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            
            const user = new User({
                ...userData,
                password: hashedPassword
            });
            
            users.push(user);
        }

        await User.save(users);
        console.log('Usuarios por defecto creados:');
        console.log('  - Super Admin: superadmin / admin123');
        console.log('  - Admin: admin / admin123');
        console.log('  - Employee: employee / employee123');
        console.log('  - Customer: customer / customer123');
    }

    // Obtener estadísticas de usuarios
    static async getStats() {
        const users = await User.getAll();
        
        const stats = {
            total: users.length,
            active: users.filter(u => u.active).length,
            inactive: users.filter(u => !u.active).length,
            byRole: {
                superadmin: users.filter(u => u.role === 'superadmin').length,
                admin: users.filter(u => u.role === 'admin').length,
                employee: users.filter(u => u.role === 'employee').length,
                customer: users.filter(u => u.role === 'customer').length
            }
        };

        return stats;
    }
}

module.exports = User;
