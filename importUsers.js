const fs = require('fs');
const nodemailer = require('nodemailer');
const connectDB = require('./config/db');
const User = require('./models/User');

function generatePassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < length; i++) {
        pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
}

// delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    await connectDB();

    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "b9589b32897544",
            pass: "363610538aed89"
        }
    });

    const data = fs.readFileSync('users.txt', 'utf-8');
    const lines = data.split('\n');

    for (let line of lines) {
        if (!line.trim()) continue;

        const [username, email] = line.trim().split(/\s+/);
        const password = generatePassword();

        try {
            const user = new User({
                username,
                email,
                password,
                role: 'user'
            });

            await user.save();

            let sent = false;
            let retry = 0;

            while (!sent && retry < 5) {
                try {
                    await transporter.sendMail({
                        from: "admin@test.com",
                        to: email,
                        subject: "Tài khoản của bạn",
                        text: `Username: ${username}\nPassword: ${password}`
                    });

                    console.log("✔ Sent:", username);
                    sent = true;

                } catch (err) {
                    retry++;
                    console.log(`⏳ Retry ${retry} for ${username}`);

                    await sleep(2000);
                }
            }

            await sleep(1500);

        } catch (err) {
            console.log("❌ Error:", err.message);
        }
    }

    console.log("🎉 DONE 100 USERS");
    process.exit();
}

run();