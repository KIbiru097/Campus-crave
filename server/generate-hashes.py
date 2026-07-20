import bcrypt

passwords = [
    ("Admin123", "admin"),
    ("Student123", "student"),
    ("Owner123", "owner"),
    ("Delivery123", "delivery"),
    ("Staff123", "staff"),
]

print("📋 Copy these hashes to update your database:")
print("=" * 60)

for password, role in passwords:
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(10))
    print(f"UPDATE users SET password_hash = '{hashed.decode('utf-8')}' WHERE email = '{role}@campuscrave.com';")

print("=" * 60)
