package ke.co.aiccathedral.messenger;

import android.content.*;
import android.app.*;
public class SmsStatusReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){
   if(!(c instanceof MainActivity)) return;
   MainActivity a=(MainActivity)c;
   boolean ok=getResultCode()==Activity.RESULT_OK;
   if("AIC_SMS_SENT".equals(i.getAction())) a.onSent(ok,i.getStringExtra("phone"));
   if("AIC_SMS_DELIVERED".equals(i.getAction())) a.onDelivered(ok);
 }
}