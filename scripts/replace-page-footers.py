"""
Replace all inline footers with <PageFooter /> across all pages.
Also adds PageFooter to pages that have no footer at all.
"""
import re, os

BASE = "/home/ubuntu/inboxbrief/client/src/pages"
COMP = "/home/ubuntu/inboxbrief/client/src/components"

def read(path):
    with open(path) as f:
        return f.read()

def write(path, content):
    with open(path, "w") as f:
        f.write(content)
    print(f"  WROTE {path}")

# ─── 1. Contact.tsx ───────────────────────────────────────────────────────────
path = f"{BASE}/Contact.tsx"
c = read(path)
# add import after existing imports
if "PageFooter" not in c:
    c = c.replace(
        'import { getLoginUrl, loginWithWarmUp } from "@/const";',
        'import { getLoginUrl, loginWithWarmUp } from "@/const";\nimport { PageFooter } from "@/components/PageFooter";'
    )
# replace footer block
old = '''      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} InboxBrief. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="/sms-opt-in" className="hover:text-foreground transition-colors">SMS Terms</Link>
          </div>
        </div>
      </footer>'''
new = '      <PageFooter />'
if old in c:
    c = c.replace(old, new, 1)
    print("  Contact.tsx: footer replaced")
else:
    print("  Contact.tsx: footer NOT FOUND (check manually)")
write(path, c)

# ─── 2. Enterprise.tsx ────────────────────────────────────────────────────────
path = f"{BASE}/Enterprise.tsx"
c = read(path)
if "PageFooter" not in c:
    c = c.replace(
        'import { MessageSquare, ArrowLeft, CheckCircle, Shield, Users, Zap, Lock, BarChart3, Headphones } from "lucide-react";',
        'import { MessageSquare, ArrowLeft, CheckCircle, Shield, Users, Zap, Lock, BarChart3, Headphones } from "lucide-react";\nimport { PageFooter } from "@/components/PageFooter";'
    )
old = '''      <footer className="border-t border-border/40 py-6 px-4 mt-8">
        <div className="container flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <span className="text-sm text-muted-foreground text-center sm:text-left">© {new Date().getFullYear()} InboxBrief. All rights reserved.</span>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button>
          </div>
        </div>
      </footer>'''
new = '      <PageFooter />'
if old in c:
    c = c.replace(old, new, 1)
    print("  Enterprise.tsx: footer replaced")
else:
    print("  Enterprise.tsx: footer NOT FOUND (check manually)")
write(path, c)

# ─── 3. Terms.tsx ─────────────────────────────────────────────────────────────
path = f"{BASE}/Terms.tsx"
c = read(path)
if "PageFooter" not in c:
    c = c.replace(
        'import { Button } from "@/components/ui/button";\nimport { Shield, ArrowLeft, MessageSquare } from "lucide-react";',
        'import { Button } from "@/components/ui/button";\nimport { Shield, ArrowLeft, MessageSquare } from "lucide-react";\nimport { PageFooter } from "@/components/PageFooter";'
    )
old = '''      <footer className="border-t border-border/40 py-6 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">© 2026 InboxBrief. All rights reserved.</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => navigate("/enterprise")} className="hover:text-foreground transition-colors">Enterprise</button>
          </div>
        </div>
      </footer>'''
new = '      <PageFooter />'
if old in c:
    c = c.replace(old, new, 1)
    print("  Terms.tsx: footer replaced")
else:
    print("  Terms.tsx: footer NOT FOUND (check manually)")
write(path, c)

# ─── 4. Pricing.tsx ───────────────────────────────────────────────────────────
path = f"{BASE}/Pricing.tsx"
c = read(path)
# find the Shield import line
if "PageFooter" not in c:
    # add after last import line
    last_import_idx = c.rfind("\nimport ")
    end_of_last_import = c.find("\n", last_import_idx + 1)
    c = c[:end_of_last_import] + '\nimport { PageFooter } from "@/components/PageFooter";' + c[end_of_last_import:]
old = '''      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span>All data encrypted at rest with AES-256-GCM</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>© 2026 InboxBrief</span>
            <span className="text-border">·</span>
            <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors">Terms</button>
            <span className="text-border">·</span>
            <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors">Privacy</button>
          </div>
        </div>
      </footer>'''
new = '      <PageFooter />'
if old in c:
    c = c.replace(old, new, 1)
    print("  Pricing.tsx: footer replaced")
else:
    print("  Pricing.tsx: footer NOT FOUND (check manually)")
write(path, c)

# ─── 5. Privacy.tsx ───────────────────────────────────────────────────────────
path = f"{BASE}/Privacy.tsx"
c = read(path)
if "PageFooter" not in c:
    c = c.replace(
        'import { Button } from "@/components/ui/button";\nimport { ArrowLeft } from "lucide-react";',
        'import { Button } from "@/components/ui/button";\nimport { ArrowLeft } from "lucide-react";\nimport { PageFooter } from "@/components/PageFooter";'
    )
old = '''        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} InboxBrief. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">Terms of Service</a>
            <a href="/sms-opt-in" className="hover:text-foreground transition-colors underline underline-offset-2">SMS Terms</a>
            <a href="/data-usage" className="hover:text-foreground transition-colors underline underline-offset-2">Data Usage</a>
            <a href="/contact" className="hover:text-foreground transition-colors underline underline-offset-2">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}'''
new = '''      </div>
    </div>
    <PageFooter />
  );
}'''
if old in c:
    c = c.replace(old, new, 1)
    print("  Privacy.tsx: footer replaced")
else:
    print("  Privacy.tsx: footer NOT FOUND (check manually)")
write(path, c)

# ─── 6. DataUsage.tsx ─────────────────────────────────────────────────────────
path = f"{BASE}/DataUsage.tsx"
c = read(path)
if "PageFooter" not in c:
    c = c.replace(
        'import { useLocation } from "wouter";\nimport { Button } from "@/components/ui/button";\nimport { ArrowLeft, ShieldCheck, Mail, Smartphone, Lock, Trash2, ExternalLink } from "lucide-react";',
        'import { useLocation } from "wouter";\nimport { Button } from "@/components/ui/button";\nimport { ArrowLeft, ShieldCheck, Mail, Smartphone, Lock, Trash2, ExternalLink } from "lucide-react";\nimport { PageFooter } from "@/components/PageFooter";'
    )
old = '''        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} InboxBrief. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-foreground transition-colors underline underline-offset-2">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">Terms of Service</a>
            <a href="/sms-opt-in" className="hover:text-foreground transition-colors underline underline-offset-2">SMS Terms</a>
            <a href="/contact" className="hover:text-foreground transition-colors underline underline-offset-2">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}'''
new = '''      </div>
    </div>
    <PageFooter />
  );
}'''
if old in c:
    c = c.replace(old, new, 1)
    print("  DataUsage.tsx: footer replaced")
else:
    print("  DataUsage.tsx: footer NOT FOUND (check manually)")
write(path, c)

# ─── 7. SmsOptIn.tsx ──────────────────────────────────────────────────────────
path = f"{BASE}/SmsOptIn.tsx"
c = read(path)
if "PageFooter" not in c:
    c = c.replace(
        'import { Link } from "wouter";\nimport { MessageSquare, Check, Shield, Clock, Phone } from "lucide-react";',
        'import { Link } from "wouter";\nimport { MessageSquare, Check, Shield, Clock, Phone } from "lucide-react";\nimport { PageFooter } from "@/components/PageFooter";'
    )
old = '''        {/* Footer links */}
        <div className="text-center text-xs text-muted-foreground space-x-4">
          <a href="/privacy" className="hover:text-foreground transition-colors underline underline-offset-2">Privacy Policy</a>
          <a href="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">Terms of Service</a>
          <a href="mailto:support@inboxbrief.org" className="hover:text-foreground transition-colors underline underline-offset-2">support@inboxbrief.org</a>
        </div>
      </main>
    </div>
  );
}'''
new = '''      </main>
      <PageFooter />
    </div>
  );
}'''
if old in c:
    c = c.replace(old, new, 1)
    print("  SmsOptIn.tsx: footer replaced")
else:
    print("  SmsOptIn.tsx: footer NOT FOUND (check manually)")
write(path, c)

# ─── 8. Dashboard.tsx — add footer before closing </div> ──────────────────────
path = f"{BASE}/Dashboard.tsx"
c = read(path)
if "PageFooter" not in c:
    # add import
    c = c.replace(
        'import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";',
        'import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";\nimport { PageFooter } from "@/components/PageFooter";'
    )
    # append before last closing </div>
    old_end = '''      </div>
    </div>
  );
}'''
    new_end = '''      </div>
      <PageFooter />
    </div>
  );
}'''
    if old_end in c:
        # replace only last occurrence
        idx = c.rfind(old_end)
        c = c[:idx] + new_end + c[idx + len(old_end):]
        print("  Dashboard.tsx: footer added")
    else:
        print("  Dashboard.tsx: closing pattern NOT FOUND (check manually)")
write(path, c)

# ─── 9. Settings.tsx — replace Legal card + add PageFooter ───────────────────
path = f"{BASE}/Settings.tsx"
c = read(path)
if "PageFooter" not in c:
    # find last import line
    last_import_idx = c.rfind("\nimport ")
    end_of_last_import = c.find("\n", last_import_idx + 1)
    c = c[:end_of_last_import] + '\nimport { PageFooter } from "@/components/PageFooter";' + c[end_of_last_import:]
old = '''        {/* Legal */}
        <div className="bg-card border border-border/40 rounded-xl p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Legal</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/terms" className="text-sm text-primary hover:underline">Terms of Service</a>
            <span className="text-muted-foreground">·</span>
            <a href="/privacy" className="text-sm text-primary hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}'''
new = '''      </div>
      <PageFooter />
    </div>
  );
}'''
if old in c:
    c = c.replace(old, new, 1)
    print("  Settings.tsx: Legal card replaced with PageFooter")
else:
    print("  Settings.tsx: Legal card NOT FOUND (check manually)")
write(path, c)

# ─── 10. Onboarding.tsx — add PageFooter before closing </div> ───────────────
path = f"{BASE}/Onboarding.tsx"
c = read(path)
if "PageFooter" not in c:
    last_import_idx = c.rfind("\nimport ")
    end_of_last_import = c.find("\n", last_import_idx + 1)
    c = c[:end_of_last_import] + '\nimport { PageFooter } from "@/components/PageFooter";' + c[end_of_last_import:]
old = '''          {/* Trial notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Your 7-day free trial includes full access to all features. No credit card required to start.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}'''
new = '''          {/* Trial notice */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Your 7-day free trial includes full access to all features. No credit card required to start.
            </p>
          </div>
        </div>
      </div>
      <PageFooter />
    </div>
  );
}'''
if old in c:
    c = c.replace(old, new, 1)
    print("  Onboarding.tsx: footer added")
else:
    print("  Onboarding.tsx: trial notice NOT FOUND (check manually)")
write(path, c)

# ─── 11. AcceptInvite.tsx — add PageFooter before closing </div> ─────────────
path = f"{BASE}/AcceptInvite.tsx"
c = read(path)
if "PageFooter" not in c:
    c = c.replace(
        'import { getLoginUrl, loginWithWarmUp } from "@/const";',
        'import { getLoginUrl, loginWithWarmUp } from "@/const";\nimport { PageFooter } from "@/components/PageFooter";'
    )
old = '''              <p className="text-xs text-muted-foreground text-center">
                By accepting, you agree to receive automated SMS messages from InboxBrief.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}'''
new = '''              <p className="text-xs text-muted-foreground text-center">
                By accepting, you agree to receive automated SMS messages from InboxBrief.
              </p>
            </div>
          )}
        </div>
      </div>
      <PageFooter />
    </div>
  );
}'''
if old in c:
    c = c.replace(old, new, 1)
    print("  AcceptInvite.tsx: footer added")
else:
    print("  AcceptInvite.tsx: closing pattern NOT FOUND (check manually)")
write(path, c)

# ─── 12. NotFound.tsx — add PageFooter ───────────────────────────────────────
path = f"{BASE}/NotFound.tsx"
c = read(path)
if "PageFooter" not in c:
    last_import_idx = c.rfind("\nimport ")
    end_of_last_import = c.find("\n", last_import_idx + 1)
    c = c[:end_of_last_import] + '\nimport { PageFooter } from "@/components/PageFooter";' + c[end_of_last_import:]
# wrap the return in a flex-col min-h-screen div
old_return_start = '  return (\n    <div'
# find the last closing of the function
old_end = '''      </Card>
    </div>
  );
}'''
new_end = '''      </Card>
      <PageFooter />
    </div>
  );
}'''
if old_end in c:
    c = c.replace(old_end, new_end, 1)
    print("  NotFound.tsx: footer added")
else:
    print("  NotFound.tsx: closing pattern NOT FOUND (check manually)")
write(path, c)

# ─── 13. Admin pages — add PageFooter ────────────────────────────────────────
for fname, import_after, old_end, new_end in [
    (
        "AdminAnnouncements.tsx",
        'import { trpc } from "@/lib/trpc";',
        '      </Dialog>\n    </div>\n  );\n}',
        '      </Dialog>\n      <PageFooter />\n    </div>\n  );\n}'
    ),
    (
        "AdminCustomers.tsx",
        'import { trpc } from "@/lib/trpc";',
        '      </Dialog>\n    </div>\n  );\n}',
        '      </Dialog>\n      <PageFooter />\n    </div>\n  );\n}'
    ),
    (
        "AdminTools.tsx",
        'import { trpc } from "@/lib/trpc";',
        '      </Dialog>\n    </div>\n  );\n}',
        '      </Dialog>\n      <PageFooter />\n    </div>\n  );\n}'
    ),
]:
    path = f"{BASE}/{fname}"
    c = read(path)
    if "PageFooter" not in c:
        c = c.replace(
            import_after,
            import_after + '\nimport { PageFooter } from "@/components/PageFooter";'
        )
    if old_end in c:
        # replace last occurrence
        idx = c.rfind(old_end)
        c = c[:idx] + new_end + c[idx + len(old_end):]
        print(f"  {fname}: footer added")
    else:
        print(f"  {fname}: closing pattern NOT FOUND (check manually)")
    write(path, c)

# ─── 14. OwnerDashboard.tsx — add PageFooter ─────────────────────────────────
path = f"{BASE}/OwnerDashboard.tsx"
c = read(path)
if "PageFooter" not in c:
    last_import_idx = c.rfind("\nimport ")
    end_of_last_import = c.find("\n", last_import_idx + 1)
    c = c[:end_of_last_import] + '\nimport { PageFooter } from "@/components/PageFooter";' + c[end_of_last_import:]
# find last closing div
old_end = '    </div>\n  );\n}'
if old_end in c:
    idx = c.rfind(old_end)
    new_end = '    <PageFooter />\n    </div>\n  );\n}'
    c = c[:idx] + new_end + c[idx + len(old_end):]
    print("  OwnerDashboard.tsx: footer added")
else:
    print("  OwnerDashboard.tsx: closing pattern NOT FOUND (check manually)")
write(path, c)

print("\nAll done.")
