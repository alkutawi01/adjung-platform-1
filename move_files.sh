for file in *\\*; do
  if [ -f "$file" ]; then
    dest=$(echo "$file" | sed 's/\\/\//g')
    mkdir -p $(dirname "$dest")
    cp "$file" "$dest"
    echo "Copied $file to $dest"
  fi
done
