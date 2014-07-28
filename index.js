var attach = funciton($) {
  $.fn.extend({
    geminiUpload: function(options) {
      var encodedCredentials;
      encodedCredentials = this.encode(options.geminiKey, '');
      return $.ajax({
        type: 'GET',
        dataType: 'json',
        url: "" + options.geminiApp + "/uploads/new.json",
        data: {
          acl: options.acl
        },
        headers: {
          'Authorization': "Basic " + encodedCredentials
        },
        success: (function(_this) {
          return function(resp) {
            return _this.renderForm(resp, options);
          };
        })(this)
      });
    },
    encode: function(key, secret) {
      return btoa(unescape(encodeURIComponent([key, secret].join(':'))));
    },
    renderForm: function(data, options) {
      var bucket, key;
      key = "" + data.policy_document.conditions[1][2] + "/${filename}";
      bucket = data.policy_document.conditions[0].bucket;
      this.$('.spiu-form').html(s3UploadForm({
        acl: data.policy_document.conditions[2].acl,
        successAction: data.policy_document.conditions[3].success_action_status,
        base64Policy: data.policy_encoded,
        signature: data.signature,
        key: key,
        s3Key: options.geminiS3AccessKey,
        uploadBucket: bucket
      }));
      return this.attachFileUploadUI(bucket, key, options);
    },
    makeGeminiRequest: (function(_this) {
      return function(data) {
        var fileName, key, metadata;
        fileName = data.files[0].name;
        key = data.key.replace('${filename}', fileName);
        metadata = {
          _type: 'ProfileIcon',
          id: _this.profile.get('id')
        };
        return $.ajax({
          type: 'POST',
          dataType: 'json',
          url: "" + options.geminiApp + "/entries.json",
          data: {
            entry: {
              source_key: key,
              source_bucket: data.bucket,
              template_key: 'profile-icon',
              metadata: metadata
            }
          },
          headers: {
            'Authorization': "Basic " + _this.encodedCredentials
          },
          success: function(resp) {
            return _this.onUploadComplete();
          }
        });
      };
    })(this),
    attachFileUploadUI: function(bucket, key, options) {
      var $form;
      $form = this.$('form');
      return $form.fileupload({
        type: 'POST',
        dataType: 'xml',
        done: (function(_this) {
          return function(e, data) {
            return _this.makeGeminiRequest(_.extend(data, {
              key: key,
              bucket: bucket
            }));
          };
        })(this),
        add: (function(_this) {
          return function(e, data) {
            var fileName, fileType;
            fileName = data.files[0].name;
            fileType = data.files[0].type;
            $(_this).find("form input[name='Content-Type']").val(fileType);
            return data.submit();
          };
        })(this),
        fail: options.onFail,
        progress: options.onProgressUpdate,
        stop: options.onStop
      });
    }
  });
};


// Export for CommonJS & window global
if (typeof module != 'undefined') {
  module.exports = attach;
} else {
  attach(window.jQuery);
}
