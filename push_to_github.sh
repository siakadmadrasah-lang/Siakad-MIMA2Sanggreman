#!/bin/bash
# Script untuk push Siakad Offline ke GitHub

echo "================================================="
echo "   Push Kode Siakad Offline ke GitHub Repository"
echo "================================================="
echo ""
echo "Remote Repo: https://github.com/siakadmadrasah-lang/Siakad-Offline.git"
echo ""

read -p "Masukkan Username GitHub: " GH_USER
read -sp "Masukkan GitHub Personal Access Token (PAT): " GH_TOKEN
echo ""

if [ -z "$GH_USER" ] || [ -z "$GH_TOKEN" ]; then
    echo "❌ Username dan Token tidak boleh kosong."
    exit 1
fi

echo "Memproses push ke branch main..."
git remote remove origin 2>/dev/null
git remote add origin "https://${GH_USER}:${GH_TOKEN}@github.com/siakadmadrasah-lang/Siakad-Offline.git"

git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Berhasil push kode ke https://github.com/siakadmadrasah-lang/Siakad-Offline.git"
else
    echo "❌ Gagal push ke GitHub. Pastikan token memiliki hak akses 'repo'."
fi
