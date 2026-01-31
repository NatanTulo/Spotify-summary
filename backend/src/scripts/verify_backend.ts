import { connectDB, sequelize } from '../config/database.js';
import { Profile } from '../models/common/Profile.js';
import { StatsAggregator } from '../utils/StatsAggregator.js';
import { DailyStats } from '../models/stats/DailyStats.js';
import { YearlyStats } from '../models/stats/YearlyStats.js';
import { Audiobook } from '../models/audiobooks/Audiobook.js';

async function verify() {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const profiles = await Profile.findAll();
        if (profiles.length === 0) {
            console.log('⚠️ No profiles found. Cannot test aggregation.');
            return;
        }

        const profileId = profiles[0].id;
        console.log(`📊 Testing aggregation for profile ID: ${profileId}`);

        const aggregator = new StatsAggregator(profileId);
        await aggregator.aggregateAllStats();

        const daily = await DailyStats.findOne({ where: { profileId } });
        console.log('📅 Sample Daily Stats:', JSON.stringify(daily, null, 2));

        const yearly = await YearlyStats.findOne({ where: { profileId } });
        console.log('📅 Sample Yearly Stats:', JSON.stringify(yearly, null, 2));

        // Verify Audiobook constraint
        console.log('📚 Testing Audiobook unique constraint...');
        try {
            await Audiobook.create({ name: 'Test', spotifyUri: 'test-uri' });
            await Audiobook.create({ name: 'Test 2', spotifyUri: 'test-uri' });
            console.log('❌ Error: Unique constraint failed (allowed duplicates)');
        } catch (e) {
            console.log('✅ Unique constraint working (blocked duplicate URI)');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        process.exit(0);
    }
}

verify();
