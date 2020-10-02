//
//  SafariWebExtensionHandler.swift
//  Call Google Translate Extension
//
//  Created by Xianqiao Wang on 2020/10/2.
//

import SafariServices
import os.log

let extensionBundleIdentifier = "xianqiao.wang.Call-Google-Translate-Extension"

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling, StreamDelegate {
    let maxReadLength = 1024 * 1024
    var inputStream: InputStream!
    var outputStream: OutputStream!
    
    func setupNetworkCommunication() {
        var readStream: Unmanaged<CFReadStream>?
        var writeStream: Unmanaged<CFWriteStream>?

        CFStreamCreatePairWithSocketToHost(kCFAllocatorDefault,
                                         "localhost" as CFString,
                                         80,
                                         &readStream,
                                         &writeStream)

        inputStream = readStream!.takeRetainedValue()
        outputStream = writeStream!.takeRetainedValue()

        inputStream.delegate = self

        inputStream.schedule(in: .current, forMode: .common)
        outputStream.schedule(in: .current, forMode: .common)

        inputStream.open()
        outputStream.open()
        
        if (outputStream != nil) {
            os_log(.default, "GTEXT:SOCKET: connectd")
        }
    }

    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        let message = item.userInfo?[SFExtensionMessageKey]
        os_log(.default, "GTEXT:REV: %@", message as! CVarArg)
        
        let response = NSExtensionItem()
        response.userInfo = [ SFExtensionMessageKey: [ "SafariWebExtensionHandler": message ] ]
        context.completeRequest(returningItems: [response], completionHandler: nil)
        
        if (outputStream == nil) {
            self.setupNetworkCommunication()
        } else {
            os_log(.default, "GTEXT:SEND: before")
            let data = "iam:Luke".data(using: .utf8)!
            data.withUnsafeBytes {
                guard let pointer = $0.baseAddress?.assumingMemoryBound(to: UInt8.self) else {
                    os_log(.default, "GTEXT:SOCKET: error")
                    return
                }
                outputStream.write(pointer, maxLength: data.count)
            }
        }
    }
}
