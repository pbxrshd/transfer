#!/usr/bin/python
import json
from HTMLParser import HTMLParser
from lxml import html
from lxml.etree import tostring
import urllib, urllib2
import cgi
import re

class DPHTMLParser(HTMLParser):
    def __init__(self, html_snippet):
        HTMLParser.__init__(self)
        self.comments = []
        self.feed(html_snippet)
        #self.feed(html_snippet.read())
    def handle_comment(self, data):
        self.comments.append(data)
    def get_comments(self):
        return self.comments

def get_fb_response():
    opener = urllib2.build_opener(urllib2.HTTPHandler(debuglevel=1))
    opener.addheaders = [('User-agent', 'Mozilla/5.0')]
    response = opener.open("https://www.facebook.com/pages/Alhuda-Youth-Program/1471242616483881")
    return response

def extract_status_snippet(html_snippet):
    tree = html.fromstring(html_snippet)
    snippet = tree.xpath('//span[@class="userContent"]')
    return snippet

def normalize_status(unnormalized_status):
    normalized = unnormalized_status
    # make single line
    normalized = normalized.replace('\n', '')
    # remove span tags with content = "..."
    normalized = re.sub(r'<span[^>]*?>\.\.\.</span>', "", normalized)
    # remove all span tags, leaving only text content
    normalized = re.sub(r'<span.*?>', "", normalized)
    normalized = re.sub(r'</span>', "", normalized)
    # remove all div tags, leaving only text content
    normalized = re.sub(r'<div.*?>', "", normalized)
    normalized = re.sub(r'</div>', "", normalized)
    # remove <a tags and content from tags that have href to # anchor
    normalized = re.sub(r'<a[^>]*?href="#"[^>]*?>[^>]*?</a>', "", normalized)
    # collapse repeated whitespace
    normalized = re.sub(r'\s+', " ", normalized)
    # fix any remaining <a to have only href, and normalise the href link itself
    normalized = re.sub(r'<a[^>]*?(href=".*?")[^>]*?>', r'<a \g<1>>', normalized)
    return normalized

def generate_content(comments, callback):
  
    if not callback:
      return ""
      
    status_snippets = []
    for comment in comments:
        statuses = extract_status_snippet(comment)
        if statuses:
            for status in statuses:
                status_snippets.append(normalize_status(tostring(status)))  
  
    content = callback + "(" + json.dumps({"status":status_snippets}) + ");"
    return content


f = open("ayhp_page_source.html")
response = f.read()
parser = DPHTMLParser(response)
comments = parser.get_comments()
f.close()

url_params = cgi.FieldStorage()
content = generate_content(comments, url_params.getvalue("callback"))

print "Content-type: application/json\n"
print content
