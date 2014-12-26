#!/usr/bin/python
import json
from HTMLParser import HTMLParser
from lxml import html
from lxml.etree import tostring
import urllib, urllib2
import cgi
import re

class FacebookDataParser(HTMLParser):
    def __init__(self, fb_page_url):
        HTMLParser.__init__(self)
        self.comments = []
        opener = urllib2.build_opener(urllib2.HTTPHandler(debuglevel=1))
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        response = opener.open(fb_page_url)
        self.feed(response.read())

    def handle_comment(self, data):
        self.comments.append(data)

    def extract_status_snippet(self, html_snippet):
        tree = html.fromstring(html_snippet)
        snippet = tree.xpath('//span[@class="userContent"]')
        return snippet

    def normalize_status(self, unnormalized_status):
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
        # normalize the br tags
        normalized = re.sub(r'<br/?>', "<br />", normalized)
        # fix any remaining <a to have only href
        normalized = re.sub(r'<a[^>]*?(href=".*?")[^>]*?>', r'<a \g<1>>', normalized)
        # normalize the href
        #normalized = re.sub(r'href="htt.*?u=' , 'href="', normalized)
        # package the status into a dict
        # try to extract a title, split on first <br />
        status_title = ""
        status_body = normalized 
        if "<br />" in normalized:
            (status_title,status_body) = normalized.split("<br />",1)
        status = {"title":status_title,"body":status_body}
        return status

    def package_statuses(self, statuses):
        packaged_statuses = {}
        # filter only for statuses that have a title
        filtered_statuses = []
        for status in statuses:
            if status["title"]:
                if status["title"].startswith("Monthly Lesson"):
                    packaged_statuses["monthly-lesson"] = status
                else:
                    filtered_statuses.append(status)
        packaged_statuses["statuses"] = filtered_statuses
        return packaged_statuses

    def get_data(self):
        status_snippets = []
        for comment in self.comments:
            statuses = self.extract_status_snippet(comment)
            if statuses:
                for status in statuses:
                    status_snippets.append(self.normalize_status(tostring(status)))  
        return self.package_statuses(status_snippets)


url_params = cgi.FieldStorage()
callback_function_name = url_params.getvalue("callback")
content = ""
if callback_function_name:
    parser = FacebookDataParser("https://www.facebook.com/pages/Alhuda-Youth-Program/1471242616483881")
    data = parser.get_data()
    content = callback_function_name + "(" + json.dumps(data) + ");"

print "Content-type: application/json\n"
print content
