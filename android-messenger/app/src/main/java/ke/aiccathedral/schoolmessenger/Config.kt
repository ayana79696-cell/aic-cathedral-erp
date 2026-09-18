package ke.aiccathedral.schoolmessenger
import android.content.Context
object Config {
 private const val P="aic_messenger"; private const val E="endpoint"; private const val T="device_token"
 private const val D="https://rmarersocrwzqhnbuygi.supabase.co/functions/v1/school-phone-sms"
 fun endpoint(c:Context)=c.getSharedPreferences(P,0).getString(E,D)?:D
 fun token(c:Context)=c.getSharedPreferences(P,0).getString(T,"")?:""
 fun save(c:Context,e:String,t:String)=c.getSharedPreferences(P,0).edit().putString(E,e.trim()).putString(T,t.trim()).apply()
 fun setLastStatus(c:Context,s:String)=c.getSharedPreferences(P,0).edit().putString("last_status",s).apply()
 fun lastStatus(c:Context)=c.getSharedPreferences(P,0).getString("last_status","Ready")?:"Ready"
}