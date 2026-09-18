package ke.aiccathedral.schoolmessenger
import android.content.*
import android.os.Build
class BootReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent){if(i.action!=Intent.ACTION_BOOT_COMPLETED&&i.action!=Intent.ACTION_MY_PACKAGE_REPLACED)return;if(Config.token(c).isBlank())return;val s=Intent(c,SmsPollingService::class.java);if(Build.VERSION.SDK_INT>=26)c.startForegroundService(s)else c.startService(s)}}