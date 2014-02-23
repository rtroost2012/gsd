import urllib
import os
import zipfile
import shutil
import glob
import sys






def dlProgress(count, blockSize, totalSize):
  global old_percent
  percent = int(count*blockSize*100/totalSize)
  if percent <> old_percent:
    old_percent = percent
    sys.stdout.write("...%d%%" % percent)
  sys.stdout.flush()
  
class GenericGameMode():
  def __init__(self, path):
    self.path = os.path.normpath(path)
  
  def download_url(self, url, path = ""):
    old_percent = 0
    global old_percent
    destination = os.path.join(self.path, path)
    urllib.urlretrieve(url, destination, reporthook=dlProgress)

  def unzip(self, source_filename, dest_dir = False):
      source_filename = os.path.join(self.path, source_filename)
      
      if not dest_dir:
	dest_dir = self.path
	
      with zipfile.ZipFile(source_filename) as zf:
	  for member in zf.infolist():
	      # Path traversal defense copied from
	      # http://hg.python.org/cpython/file/tip/Lib/http/server.py#l789
	      words = member.filename.split('/')
	      path = dest_dir
	      for word in words[:-1]:
		  drive, word = os.path.splitdrive(word)
		  head, word = os.path.split(word)
		  if word in (os.curdir, os.pardir, ''): continue
		  path = os.path.join(path, word)
	      zf.extract(member, path)
    
  def delete(self, path):
      path = os.path.join(self.path, path)
      
      if "*" in path:
        for f in glob.glob(path):
	  os.remove(f)
      else:
	if os.path.isdir(path):
	  shutil.rmtree(path)
	else:
	  os.remove(path)
	  
  def rename(self, from_path, to_path):
      from_path = os.path.join(self.path, from_path)
      to_path = os.path.join(self.path, to_path)
      os.rename(from_path, to_path)
      
  def set_cli(self,var, val):
      sys.stdout.write("SET CL '%s' = '%s'" % (var,val))