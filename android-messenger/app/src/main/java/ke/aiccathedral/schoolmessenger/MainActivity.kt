package ke.aiccathedral.schoolmessenger
import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.*
import android.provider.Settings
import android.view.Gravity
import android.widget.*
import java.util.concurrent.Executors
class MainActivity:Activity(){
 private lateinit var token:EditText;private lateinit var endpoint:EditText;private lateinit var conn:TextView;private lateinit var queue:TextView;private lateinit var status:TextView;private val ex=Executors.newSingleThreadExecutor();private val h=Handler(Looper.getMainLooper())
 override fun onCreate(b:Bundle?){super.onCreate(b);ui();permissions();start();refresh()}
 private fun ui(){val r=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(48,48,48,48)};fun tv(t:String,s:Float)=TextView(this).apply{text=t;textSize=s};r.addView(tv("AIC School Messenger",30f));r.addView(tv("School phone SMS bridge",18f));conn=tv("Connecting…",20f);r.addView(conn);endpoint=EditText(this).apply{hint="Supabase SMS function URL";setSingleLine();setText(Config.endpoint(this@MainActivity))};r.addView(endpoint);token=EditText(this).apply{hint="Device token";setSingleLine();setText(Config.token(this@MainActivity));inputType=129};r.addView(token);r.addView(Button(this).apply{text="SAVE & TEST CONNECTION";setOnClickListener{Config.save(this@MainActivity,endpoint.text.toString(),token.text.toString());check();start()}});queue=tv("Checking queue…",18f);r.addView(queue);r.addView(Button(this).apply{text="CHECK FOR SMS";setOnClickListener{check()}});r.addView(Button(this).apply{text="SMS SERVICE ACTIVE";setOnClickListener{start();Toast.makeText(this@MainActivity,"Automatic SMS service is running",Toast.LENGTH_SHORT).show()}});status=tv("Status: Ready",17f);r.addView(status);r.addView(tv("Keep the school phone powered, online, and the school SIM active. SMS charges depend on the carrier plan.",14f));setContentView(r)}
 private fun permissions(){val n=mutableListOf<String>();if(checkSelfPermission(Manifest.permission.SEND_SMS)!=PackageManager.PERMISSION_GRANTED)n.add(Manifest.permission.SEND_SMS);if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)n.add(Manifest.permission.POST_NOTIFICATIONS);if(n.isNotEmpty())requestPermissions(n.toTypedArray(),77);try{if(Build.VERSION.SDK_INT>=23){val p=getSystemService(PowerManager::class.java);if(!p.isIgnoringBatteryOptimizations(packageName))startActivity(Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,Uri.parse("package:$packageName")))}}catch(_:Exception){}}
 private fun check(){ex.execute{try{val a=ApiClient.check(this).optJSONArray("recipients");val n=a?.length()?:0;runOnUiThread{conn.text="Connected ✓";queue.text=if(n==0)"No pending broadcast" else "$n SMS ready to send"}}catch(e:Exception){runOnUiThread{conn.text="Connection error ✕";queue.text=e.message?:"Unable to connect"}}}}
 private fun start(){val i=Intent(this,SmsPollingService::class.java);if(Build.VERSION.SDK_INT>=26)startForegroundService(i)else startService(i)}
 private fun refresh(){status.text="Status: ${Config.lastStatus(this)}";h.postDelayed({refresh()},1500)}
 override fun onDestroy(){h.removeCallbacksAndMessages(null);ex.shutdownNow();super.onDestroy()}
}