const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const moment = require('moment');

// إعدادات النسخ الاحتياطي
const backupConfig = {
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 7, // الاحتفاظ بآخر 7 نسخ احتياطية
  dbConfig: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
};

// إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجودًا
if (!fs.existsSync(backupConfig.backupDir)) {
  fs.mkdirSync(backupConfig.backupDir, { recursive: true });
}

// وظيفة إنشاء نسخة احتياطية
async function createBackup() {
  try {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupFileName = `backup_${timestamp}.sql`;
    const backupFilePath = path.join(backupConfig.backupDir, backupFileName);
    
    // أمر النسخ الاحتياطي لـ MySQL
    const cmd = `mysqldump -h ${backupConfig.dbConfig.host} -u ${backupConfig.dbConfig.user} -p${backupConfig.dbConfig.password} ${backupConfig.dbConfig.database} > "${backupFilePath}"`;
    
    await execPromise(cmd);
    console.log(`تم إنشاء نسخة احتياطية بنجاح: ${backupFileName}`);
    
    // حذف النسخ الاحتياطية القديمة
    cleanOldBackups();
    
    return backupFilePath;
  } catch (error) {
    console.error('فشل إنشاء نسخة احتياطية:', error);
    throw error;
  }
}

// وظيفة حذف النسخ الاحتياطية القديمة
function cleanOldBackups() {
  try {
    const backupFiles = fs.readdirSync(backupConfig.backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupConfig.backupDir, file),
        time: fs.statSync(path.join(backupConfig.backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // ترتيب تنازلي حسب الوقت
    
    // حذف النسخ الاحتياطية الزائدة
    if (backupFiles.length > backupConfig.maxBackups) {
      const filesToDelete = backupFiles.slice(backupConfig.maxBackups);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`تم حذف النسخة الاحتياطية القديمة: ${file.name}`);
      });
    }
  } catch (error) {
    console.error('فشل في تنظيف النسخ الاحتياطية القديمة:', error);
  }
}

// وظيفة استعادة نسخة احتياطية
async function restoreBackup(backupFilePath) {
  try {
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`ملف النسخة الاحتياطية غير موجود: ${backupFilePath}`);
    }
    
    // أمر استعادة النسخة الاحتياطية
    const cmd = `mysql -h ${backupConfig.dbConfig.host} -u ${backupConfig.dbConfig.user} -p${backupConfig.dbConfig.password} ${backupConfig.dbConfig.database} < "${backupFilePath}"`;
    
    await execPromise(cmd);
    console.log(`تم استعادة النسخة الاحتياطية بنجاح: ${path.basename(backupFilePath)}`);
    
    return true;
  } catch (error) {
    console.error('فشل استعادة النسخة الاحتياطية:', error);
    throw error;
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  getBackupsList: () => {
    return fs.readdirSync(backupConfig.backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(backupConfig.backupDir, file),
        time: fs.statSync(path.join(backupConfig.backupDir, file)).mtime,
        size: fs.statSync(path.join(backupConfig.backupDir, file)).size
      }))
      .sort((a, b) => b.time - a.time); // ترتيب تنازلي حسب الوقت
  }
};