package ke.aiccathedral.schoolmessenger
import android.app.*
import android.content.Intent
import android.os.*
import android.telephony.SmsManager
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
class SmsPollingService:Service(){
 private val ex=Executors.newSingleThreadScheduledExecutor(); private val ch="aic_sms_bridge"
 override fun onCreate(){super.onCreate();if(Build.VERSION.SDK_INT>=26){getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(ch,"AIC School Messenger",NotificationManager.IMPORTANCE_LOW))};startForeground(1001,notification());ex.scheduleWithFixedDelay({poll()},0,15,TimeUnit.SECONDS)}
 private fun poll(){try{if(Config.token(this).isBlank()){Config.setLastStatus(this,"Device token required");return};val a=ApiClient.check(this).optJSONArray("recipients");if(a==null||a.length()==0){Config.setLastStatus(this,"No pending broadcast");return};Config.setLastStatus(this,"Sending ${a.length()} SMS");for(i in 0 until a.length()){val r=a.getJSONObject(i);sendOne(r.optString("id"),r.optString("phone"),r.optString("message"));Thread.sleep(1200)}}catch(e:Exception){Config.setLastStatus(this,"Connection error: ${e.message}")}}
 private fun sendOne(id:String,phone:String,msg:String){if(id.isBlank()||phone.isBlank()||msg.isBlank())return;try{val pi=PendingIntent.getBroadcast(this,id.hashCode(),Intent("SMS_SENT_$id").setPackage(packageName).putExtra("recipient_id",id),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE);SmsManager.getDefault().sendTextMessage(phone,null,msg,pi,null)}catch(e:Exception){try{ApiClient.complete(this,id,false,e.message)}catch(_:Exception){};Config.setLastStatus(this,"Failed: $phone")}}
 private fun notification():Notification=Notification.Builder(this,if(Build.VERSION.SDK_INT>=26)ch else "").setContentTitle("AIC School Messenger").setContentText("SMS bridge is active").setSmallIcon(android.R.drawable.stat_notify_sync).setOngoing(true).build()
 override fun onDestroy(){ex.shutdownNow();super.onDestroy()};override fun onBind(i:Intent?):IBinder?=null
}