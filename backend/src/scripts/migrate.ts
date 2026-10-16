import { migrate } from '../config/migrations.js'
import { sequelize } from '../config/database.js'
try { await migrate(); console.log('Database migrations complete') }
catch (error) { console.error(error); process.exitCode = 1 }
finally { await sequelize.close() }
