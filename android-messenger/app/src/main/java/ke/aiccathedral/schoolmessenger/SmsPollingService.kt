package ke.aiccathedral.schoolmessenger

import android.app.*
import android.content.Intent
import android.os.Build
import android.os.IBinder
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class SmsPollingService : Service() {
    private val executor = Executors.newSingleThreadScheduledExecutor()
    private val channelId = "aic_sms_bridge"

    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= 26) {
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(
                    NotificationChannel(channelId, "AIC School Messenger", NotificationManager.IMPORTANCE_LOW)
                )
        }
        startForeground(1001, notification())
        executor.scheduleWithFixedDelay({ poll() }, 0, 5, TimeUnit.SECONDS)
    }

    private fun poll() {
        try {
            val result = ApiClient.check(this)
            val n = result.optJSONArray("recipients")?.length() ?: 0
            Config.setLastStatus(this, if (n == 0) "Waiting for ERP SMS" else "${n} SMS ready to send")
        } catch (_: Exception) {
            Config.setLastStatus(this, "ERP connection error")
        }
    }

    private fun notification(): Notification {
        return if (Build.VERSION.SDK_INT >= 26) {
            Notification.Builder(this, channelId)
                .setContentTitle("AIC School Messenger")
                .setContentText("ERP SMS queue monitoring is active")
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setOngoing(true)
                .build()
        } else {
            Notification.Builder(this)
                .setContentTitle("AIC School Messenger")
                .setContentText("ERP SMS queue monitoring is active")
                .setSmallIcon(android.R.drawable.stat_notify_sync)
                .setOngoing(true)
                .build()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_STICKY
    override fun onDestroy() { executor.shutdownNow(); super.onDestroy() }
    override fun onBind(intent: Intent?): IBinder? = null
}
