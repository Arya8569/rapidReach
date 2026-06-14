import shutil
import os
import datetime

def create_checkpoint():
    # Define paths
    source_dir = os.getcwd()
    backup_dir = os.path.join(source_dir, "checkpoints")
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_filename = f"checkpoint_v1_stable_{timestamp}"
    zip_path = os.path.join(backup_dir, zip_filename)

    # Ensure backup directory exists
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)

    # Files and directories to include
    include_dirs = ["src", "backend"]
    include_files = ["package.json", "index.html", "vite.config.ts", "tsconfig.json", "tailwind.config.js", ".env.local"]

    print(f"Creating checkpoint '{zip_filename}.zip' in '{backup_dir}'...")

    # Create a temporary folder for the zip content
    temp_folder = os.path.join(backup_dir, "temp_pack")
    if os.path.exists(temp_folder):
        shutil.rmtree(temp_folder)
    os.makedirs(temp_folder)

    try:
        # Copy directories
        for d in include_dirs:
            src_path = os.path.join(source_dir, d)
            dst_path = os.path.join(temp_folder, d)
            if os.path.exists(src_path):
                shutil.copytree(src_path, dst_path)
                print(f"  + Included directory: {d}")
            else:
                print(f"  - Warning: Directory not found: {d}")

        # Copy files
        for f in include_files:
            src_path = os.path.join(source_dir, f)
            dst_path = os.path.join(temp_folder, f)
            if os.path.exists(src_path):
                shutil.copy(src_path, dst_path)
                print(f"  + Included file: {f}")
            else:
                print(f"  - Warning: File not found: {f}")

        # Zip it up
        shutil.make_archive(zip_path, 'zip', temp_folder)
        print(f"\n✅ Checkpoint saved successfully: {zip_path}.zip")

    except Exception as e:
        print(f"\n❌ Error creating checkpoint: {e}")
    finally:
        # Cleanup temp folder
        if os.path.exists(temp_folder):
            shutil.rmtree(temp_folder)

if __name__ == "__main__":
    create_checkpoint()
