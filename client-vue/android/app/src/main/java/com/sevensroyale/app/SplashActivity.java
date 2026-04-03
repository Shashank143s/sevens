package com.sevensroyale.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.appcompat.app.AppCompatActivity;

public class SplashActivity extends AppCompatActivity {
    private static final long SPLASH_DELAY_MS = 2000L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);
        configureBrandMark();

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
            finish();
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        }, SPLASH_DELAY_MS);
    }

    private void configureBrandMark() {
        WebView brandMarkView = findViewById(R.id.splashBrandMark);
        if (brandMarkView == null) return;

        WebSettings settings = brandMarkView.getSettings();
        settings.setJavaScriptEnabled(false);
        settings.setAllowFileAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        brandMarkView.setBackgroundColor(Color.TRANSPARENT);
        brandMarkView.setVerticalScrollBarEnabled(false);
        brandMarkView.setHorizontalScrollBarEnabled(false);

        String html = "<!doctype html><html><head><meta charset=\"utf-8\" />"
            + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />"
            + "<style>html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden;}"
            + "body{display:flex;align-items:center;justify-content:center;}"
            + "img{width:100%;height:100%;object-fit:contain;display:block;}</style>"
            + "</head><body><img src=\"sevens-seven-suits-mark.svg\" alt=\"Sevens Royale\" /></body></html>";

        brandMarkView.loadDataWithBaseURL(
            "file:///android_asset/public/branding/",
            html,
            "text/html",
            "UTF-8",
            null
        );
    }
}
