if (!process.env.TS_NODE_DEV) {
    require('module-alias/register');
}
import adminSeedsData from "@config/seed/system/admin.seed.config";
import {connectDB} from "@database/connection";
import {CustomerModel} from "@database/model";
import ServerLogger from "@middleware/server_logging.middleware";
import {debugLog} from "@utils/index";


const initiateSystemSeed = async () => {

    // connect DB
    connectDB();

    debugLog('System Seeds STARTS');
    // All seeds initialize here
    await seedAdmin();
    debugLog('System Seeds DONE');
}

const seedAdmin = async () => {
    try {
        debugLog('Admin Seed Initiated');

        for (const adminSeedData of adminSeedsData) {
            debugLog('Checking existing admin for:', adminSeedData.email);

            // Fetch existing customer and privilege data in parallel
            const [existingAdmin] = await Promise.all([
                CustomerModel.findOne({
                    email: adminSeedData.email,
                    userType: adminSeedData.userType,
                    isDeleted: false,
                }, '_id'), // Fetch only _id to optimize query
            ]);

            if (existingAdmin) {
                debugLog(`Admin with email ${adminSeedData.email} already exists. Skipping...`);
                continue; // Skip if admin already exists
            }

            debugLog(`No active admin found for ${adminSeedData.email}. Proceeding with seeding.`);

            // Create the admin account (without userType or role since they now belong to workspace)
            const customerData = {
                email: adminSeedData.email,
                password: adminSeedData.password,
                name: adminSeedData.name,
                userType: adminSeedData.userType,
                isEmailVerified: true,
            };

            const adminDoc = new CustomerModel(customerData);
            const savedCustomer = await adminDoc.save();

            if (!savedCustomer) {
                debugLog(`Failed to create admin for email: ${adminSeedData.email}`);
                continue;
            }
            debugLog(`Admin with email ${adminSeedData.email} seeded successfully with workspace.`);
        }

        debugLog('Admin Seed Successfully DONE');
    } catch (error: any) {
        console.error(error);
        ServerLogger.error(error);
    }
};

console.log('system db runner called')
initiateSystemSeed().then(() => ServerLogger.info('System Seed created'));
