const fs = require('fs');
const path = require('path');

const source = path.join(process.cwd(), 'app/(student)/results');
const dest = path.join(process.cwd(), 'app/(student)/student/results');

try {
    if (fs.existsSync(source)) {
        console.log(`Moving ${source} to ${dest}`);
        fs.renameSync(source, dest);
        console.log('Move successful');
    } else {
        console.log(`Source directory ${source} does not exist`);
    }
} catch (error) {
    console.error('Move failed:', error);
}
