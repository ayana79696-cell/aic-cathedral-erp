package ke.aiccathedral.schoolmessenger
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.SmsManager
import java.util.concurrent.Executors
class SmsResultReceiver:BroadcastReceiver(){
 override fun onReceive(c:Context,i:Intent){val id=i.getStringExtra("recipient_id")?:return;val ok=resultCode==android.app.Activity.RESULT_OK;val err=if(ok)null else "SMS send failed (code $resultCode)";val p=goAsync();Executors.newSingleThreadExecutor().execute{try{ApiClient.complete(c.applicationContext,id,ok,err);Config.setLastStatus(c.applicationContext,if(ok)"Message Sent ✓" else "Message Failed")}catch(e:Exception){Config.setLastStatus(c.applicationContext,"Feedback error: ${e.message}")}finally{p.finish()}}}
}